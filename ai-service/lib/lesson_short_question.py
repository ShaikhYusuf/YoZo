import json
import logging
import time
import numpy as np
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate

from lib.utility import Utility

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#------------------- Short Questions Template ------------------#
SHORT_QUESTION_PROMPT_TEMPLATE = """
You are an expert educator.

Your task is to generate short-answer questions STRICTLY following the schema.

VERY IMPORTANT RULES:
1. Generate EXACTLY 5 questions.
2. Questions MUST be open-ended. NEVER create Yes/No questions.
3. Each question must focus on a DIFFERENT concept from the paragraph.
4. Each question MUST include a concise and correct "sample_answer".
5. NEVER omit fields.
6. Do NOT generate extra fields.
7. Use simple, student-friendly language.
8. The answer must be short (1–2 sentences).
9. Output ONLY valid JSON.
10. Do NOT include explanations outside the JSON.

Paragraph:
{paragraph}

{format_instructions}
"""

# ------------------- Short Questions Data Model ------------------#
class ShortQuestion(BaseModel):
    question: str = Field(description="A clear, concise open-ended question.")
    answer: str = Field(description="A 1-2 sentence ideal answer based on the text.")
    answer_embedding: Optional[List[float]] = Field(default=None, description="The embedding vector of the correct answer.")

class ShortQuestionSet(BaseModel):
    questions: List[ShortQuestion] = Field(description="A list of short-answer questions.")

    @field_validator('questions')
    @classmethod
    def check_count(cls, v):
        if len(v) < 1:
            raise ValueError("The set must contain at least 1 question.")
        return v

class MyLessonShortQuestion():
    table_name = "short_answer_questions"
    llm: Any = None
    conn: Any = None

    @classmethod
    def initialize(cls, llm, conn):
        cls.llm = llm
        cls.conn = conn

    @classmethod
    def sanitize(cls, raw: Any) -> Any:
        if not isinstance(raw, dict):
            return raw

        # 1. Handle Case where LLM returns a single object instead of a wrapper with "questions": []
        if "questions" not in raw:
            if "question" in raw:
                logger.info("Sanitizer: Detected single ShortQuestion object, wrapping in 'questions' list.")
                raw = {"questions": [raw]}
            else:
                for k, v in raw.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "question" in v[0]:
                        logger.info(f"Sanitizer: Found ShortQuestions in key '{k}', remapping to 'questions'.")
                        raw = {"questions": v}
                        break
        
        # 2. Handle Case where 'questions' is a single dict
        if "questions" in raw and isinstance(raw["questions"], dict):
            logger.info("Sanitizer: 'questions' field is a dict, wrapping in list.")
            raw["questions"] = [raw["questions"]]

        if "questions" not in raw or not isinstance(raw["questions"], list):
            return raw

        cleaned = []
        for q in raw["questions"]:
            if not isinstance(q, dict) or "question" not in q: continue
            
            # Ensure required fields
            if "answer" not in q: q["answer"] = "Sample answer unavailable."
            
            cleaned.append(q)
            
        raw["questions"] = cleaned
        return raw

    @staticmethod
    def _extract_json_from_error(e: Exception) -> Optional[dict]:
        text = str(e)
        import re
        m = re.search(r"(\{.*?\})", text, re.DOTALL)
        if not m: m = re.search(r"(\{.*\})", text, re.DOTALL)
        if not m: return None
        try:
            return json.loads(m.group(1))
        except:
            return None

    @classmethod
    async def generate_contents(cls, path, input_content_text) -> ShortQuestionSet:
        parser = PydanticOutputParser(pydantic_object=ShortQuestionSet)
        prompt = PromptTemplate(
            template=SHORT_QUESTION_PROMPT_TEMPLATE,
            input_variables=["paragraph"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        # Assuming cls.llm is already initialized as shown in previous turns
        chain = prompt | cls.llm | parser

        max_attempts = 3
        response: Any = None
        start_time = time.time()
        
        logger.info(f"START generation for short questions: {path}")
        
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"Generation attempt {attempt}/{max_attempts} for path: {path}")
                response = chain.invoke({"paragraph": input_content_text})
                break
            except OutputParserException as e:
                logger.warning(f"Output parsing failed on attempt {attempt}: {e}")
                
                raw_json = cls._extract_json_from_error(e)
                if raw_json:
                    logger.info(f"Attempting to sanitize and recover from: {raw_json}")
                    sanitized_json = cls.sanitize(raw_json)
                    try:
                        response = ShortQuestionSet(**sanitized_json)
                        logger.info("Recovery SUCCESSFUL.")
                        break
                    except Exception as rex:
                        logger.error(f"Recovery failed: {rex}")
                        pass

                if attempt == max_attempts:
                    logger.error(f"Max attempts reached. Failed to parse short questions for {path}")
                    raise

        duration = time.time() - start_time
        logger.info(f"END generation for short questions: {path} | Duration: {duration:.2f}s")

        if response is None or not hasattr(response, 'questions') or response.questions is None or len(response.questions) == 0:
            logger.error(f"Strict validation FAILED for {path}: Result is empty or malformed.")
            raise RuntimeError("Generated short questions are empty or malformed.")

        for question in (response.questions or []):
            embeddings = Utility.convert_text_to_embedding(question.answer)
            if embeddings is not None:
                question.answer_embedding = embeddings.tolist()

        cls.insert_data_db(
            path=path,
            data=response)

        return response

    @classmethod
    async def generate_response(cls, path) -> Optional[ShortQuestionSet]:
        from lib.lesson_store import MyLessonStore
        
        logger.info(f"Checking cache for short questions: {path}")
        question_answer_set = cls.read_from_db(path)
        if question_answer_set:
            logger.info(f"Cache HIT for short questions: {path}")
            return question_answer_set
            
        logger.info(f"Cache MISS for short questions: {path}. Proceeding to generation.")
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        raise RuntimeError(f"Base lesson content not found or empty for path/ID: {path}. Cannot generate short questions.")

    @classmethod
    def insert_data_db(cls, path: str, data: ShortQuestionSet):
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_name} (
            id SERIAL PRIMARY KEY,
            path TEXT UNIQUE,
            questions_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """

        upsert_query = f"""
        INSERT INTO {cls.table_name} (path, questions_json)
        VALUES (%s, %s)
        ON CONFLICT (path) 
        DO UPDATE SET 
            questions_json = EXCLUDED.questions_json;
        """

        # model_dump() handles the serialization of the float list automatically
        questions_data = [q.model_dump() for q in data.questions]

        # Using json.dumps ensures the float precision is handled correctly for JSONB
        values = (path, json.dumps(questions_data))

        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for Short Questions: {path}")
            return

        try:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                conn.commit()
                print(f"Successfully saved Short Questions: {path}")
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving Short Questions: {e}")

    @classmethod
    def read_from_db(cls, path: str) -> Optional[ShortQuestionSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        
        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for Short Questions read: {path}")
            return None

        try:
            with conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()
                
                if not row:
                    return None
                
                questions_json = row[0]
                
                # Reconstruct the ShortQuestionSet object
                # This will automatically trigger the check_count validator
                return ShortQuestionSet(
                    questions=[ShortQuestion(**q) for q in (questions_json or [])]
                )
        except Exception as e:
            print(f"Error reading Short Questions: {e}")
            return None