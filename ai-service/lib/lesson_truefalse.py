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

#------------------- True/False Quiz Template ------------------#
TF_QUIZ_PROMPT_TEMPLATE = """
You are an expert educator.

Your task is to generate True/False questions STRICTLY following the schema.

VERY IMPORTANT RULES:
1. Generate EXACTLY 5 questions.
2. Each question MUST be a declarative statement (not a question).
3. The answer MUST be exactly either "True" or "False".
4. Each statement must test a different concept from the paragraph.
5. Provide a clear explanation based strictly on the paragraph.
6. NEVER omit required fields.
7. Do NOT generate extra fields.
8. Use simple and student-friendly language.
9. Output ONLY valid JSON.
10. Do NOT include explanations outside the JSON.

Paragraph:
{paragraph}

{format_instructions}
"""

# ------------------- True/False Quiz Data Model ------------------#
class TrueFalseQuestion(BaseModel):
    question: str = Field(description="A factual statement to be evaluated as True or False.")
    options: List[str] = Field(
        default=["True", "False"], 
        description="The options for the question (Always True and False)."
    )
    answer: str = Field(description="The correct answer, must be exactly 'True' or 'False'.")
    answer_embedding: Optional[List[float]] = Field(default=None, description="The embedding vector of the correct answer.")

    @field_validator('answer')
    @classmethod
    def validate_answer(cls, v):
        if v not in ["True", "False"]:
            raise ValueError("Answer must be either 'True' or 'False'")
        return v

class TrueFalseSet(BaseModel):
    questions: List[TrueFalseQuestion] = Field(description="A list of true/false questions.")

    @field_validator('questions')
    @classmethod
    def check_count(cls, v):
        if len(v) < 1:
            raise ValueError("The set must contain at least 1 question.")
        return v

class MyLessonTrueFalse():
    table_name = "true_false_questions"
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
                logger.info("Sanitizer: Detected single T/F object, wrapping in 'questions' list.")
                raw = {"questions": [raw]}
            else:
                for k, v in raw.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "question" in v[0]:
                        logger.info(f"Sanitizer: Found T/F questions in key '{k}', remapping to 'questions'.")
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
            if "answer" not in q: q["answer"] = "True"
            if q["answer"] not in ["True", "False"]:
                q["answer"] = "True" if "true" in str(q["answer"]).lower() else "False"
            
            q["options"] = ["True", "False"]
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
    async def generate_contents(cls, path, input_content_text) -> TrueFalseSet:
        parser = PydanticOutputParser(pydantic_object=TrueFalseSet)
        prompt = PromptTemplate(
            template=TF_QUIZ_PROMPT_TEMPLATE,
            input_variables=["paragraph"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        # Assuming cls.llm is already initialized as shown in previous turns
        chain = prompt | cls.llm | parser

        max_attempts = 3
        response: Any = None
        start_time = time.time()
        
        logger.info(f"START generation for true/false: {path}")
        
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
                        response = TrueFalseSet(**sanitized_json)
                        logger.info("Recovery SUCCESSFUL.")
                        break
                    except Exception as rex:
                        logger.error(f"Recovery failed: {rex}")
                        pass

                if attempt == max_attempts:
                    logger.error(f"Max attempts reached. Failed to parse true/false for {path}")
                    raise

        duration = time.time() - start_time
        logger.info(f"END generation for true/false: {path} | Duration: {duration:.2f}s")

        if response is None or not hasattr(response, 'questions') or response.questions is None or len(response.questions) == 0:
            logger.error(f"Strict validation FAILED for {path}: Result is empty or malformed.")
            raise RuntimeError("Generated true/false questions are empty or malformed.")

        for question in (response.questions or []):
            embeddings = Utility.convert_text_to_embedding(question.answer)
            if embeddings is not None:
                question.answer_embedding = embeddings.tolist()

        cls.insert_data_db(
            path=path,
            data=response)

        return response

    @classmethod
    async def generate_response(cls, path) -> Optional[TrueFalseSet]:
        from lib.lesson_store import MyLessonStore
        
        logger.info(f"Checking cache for true/false: {path}")
        true_false_set = cls.read_from_db(path)
        if true_false_set:
            logger.info(f"Cache HIT for true/false: {path}")
            return true_false_set 
            
        logger.info(f"Cache MISS for true/false: {path}. Proceeding to generation.")
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        raise RuntimeError(f"Base lesson content not found or empty for path/ID: {path}. Cannot generate true/false questions.")

    @classmethod
    def insert_data_db(cls, path: str, data: TrueFalseSet):
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
            print(f"Error: Database connection not initialized for True/False: {path}")
            return

        try:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                conn.commit()
                print(f"Successfully saved True/False questions: {path}")
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving True/False: {e}")

    @classmethod
    def read_from_db(cls, path: str) -> Optional[TrueFalseSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        
        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for True/False read: {path}")
            return None

        try:
            with conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()
                
                if not row:
                    return None
                
                questions_json = row[0]
                
                # Reconstruct the TrueFalseSet object
                # This will automatically trigger the check_count validator
                return TrueFalseSet(
                    questions=[TrueFalseQuestion(**q) for q in (questions_json or [])]
                )
        except Exception as e:
            print(f"Error reading True/False: {e}")
            return None