import json
import re
import logging
import time
import numpy as np

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate

from lib.utility import Utility

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#------------------- Quiz Template ------------------#
QUIZ_PROMPT_TEMPLATE = """
You are an expert educator.

Your task is to generate a multiple-choice quiz STRICTLY following the schema.

RULES (VERY IMPORTANT):
1. Generate EXACTLY 5 questions.
2. Each question MUST contain EXACTLY 4 options.
3. Options MUST be short phrases.
4. The "answer" MUST be EXACTLY one of the 4 options.
5. NEVER generate more than 4 options.
6. NEVER omit the fields: question, options, answer, explanation.
7. Do NOT add extra fields.
8. Output ONLY valid JSON.

Paragraph:
{paragraph}

{format_instructions}
"""

# ------------------- Quiz Data Model ------------------#
class Quiz(BaseModel):
    question: str = Field(description="The multiple-choice question text.")
    options: List[str] = Field(
        description="A list of exactly 4 options.", 
        min_length=4, 
        max_length=4
    )
    answer: str = Field(description="The correct option string from the options list.")
    answer_embedding: Optional[List[float]] = Field(default=None, description="The embedding vector of the correct answer.")
    explanation: str = Field(description="A brief explanation of why the answer is correct.")

class QuizSet(BaseModel):
    questions: List[Quiz] = Field(description="A list of quiz questions.")
    @field_validator('questions')
    @classmethod
    def check_count(cls, v):
        if len(v) < 1:
            raise ValueError("The set must contain at least 1 question.")
        return v

class MyLessonQuiz():
    table_name = "multiple_choice_quizzes"
    llm: Any = None
    conn: Any = None

    @classmethod
    def sanitize(cls, raw: Any) -> Any:
        if not isinstance(raw, dict):
            return raw

        # 1. Handle Case where LLM returns a single object instead of a wrapper with "questions": []
        if "questions" not in raw:
            # If it has keys like 'question', 'options', 'answer', wrap it
            if "question" in raw:
                logger.info("Sanitizer: Detected single question object, wrapping in 'questions' list.")
                raw = {"questions": [raw]}
            else:
                # Maybe it's {"quiz": [{"question":...}]} or similar
                for k, v in raw.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "question" in v[0]:
                        logger.info(f"Sanitizer: Found questions in key '{k}', remapping to 'questions'.")
                        raw = {"questions": v}
                        break
        
        # 2. Handle Case where 'questions' is a single dict instead of a list
        if "questions" in raw and isinstance(raw["questions"], dict):
            logger.info("Sanitizer: 'questions' field is a dict, wrapping in list.")
            raw["questions"] = [raw["questions"]]

        if "questions" not in raw or not isinstance(raw["questions"], list):
            logger.warning(f"Sanitizer: Could not find valid questions list in: {list(raw.keys())}")
            return raw

        cleaned = []
        for q in raw["questions"]:
            if not isinstance(q, dict): continue
            
            # Ensure required fields exist
            if "question" not in q: continue
            
            # Options fixup
            options_raw = q.get("options", [])
            if not isinstance(options_raw, list):
                if hasattr(options_raw, "__iter__") and not isinstance(options_raw, (str, bytes)):
                    options_raw = list(options_raw)
                else:
                    options_raw = [str(options_raw)]
            
            # Use explicit list constructor
            options = [str(options_raw[i]) for i in range(min(4, len(options_raw)))]
            
            while len(options) < 4:
                options.append("Unknown")

            q["options"] = options
            if "answer" not in q or not q["answer"]:
                q["answer"] = options[0] if len(options) > 0 else "Unknown"

            if "explanation" not in q or not q["explanation"]:
                q["explanation"] = "Explanation unavailable."
            cleaned.append(q)
        raw["questions"] = [cleaned[i] for i in range(min(5, len(cleaned)))]
        return raw

    @staticmethod
    def _extract_json_from_error(e: Exception) -> Optional[dict]:
        """Try to salvage JSON-like payload from a parsing exception message."""
        text = str(e)
        # Use non-greedy match to find the first JSON object
        m = re.search(r"(\{.*?\})", text, re.DOTALL)
        if not m:
            # Try greedy as last resort if no non-greedy match works (unlikely for single objects)
            m = re.search(r"(\{.*\})", text, re.DOTALL)
            
        if not m:
            return None
        json_text = m.group(1)
        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            return None

    @classmethod
    def initialize(cls, llm, conn):
        cls.llm = llm
        cls.conn = conn

    @classmethod
    async def generate_contents(cls, path, input_content_text) -> QuizSet:
        parser = PydanticOutputParser(pydantic_object=QuizSet)
        prompt = PromptTemplate(
            template=QUIZ_PROMPT_TEMPLATE,
            input_variables=["paragraph"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        if cls.llm is None:
            raise RuntimeError("LLM not initialized. Call MyLessonQuiz.initialize(llm, conn) first.")

        # Assuming cls.llm is already initialized as shown in previous turns
        chain = prompt | cls.llm | parser

        max_attempts = 3
        response: Any = None
        start_time = time.time()
        
        logger.info(f"START generation for quiz: {path}")
        
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"Generation attempt {attempt}/{max_attempts} for path: {path}")
                response = chain.invoke({"paragraph": input_content_text})
                break
            except OutputParserException as e:
                logger.warning(f"Output parsing failed on attempt {attempt}: {e}")
                
                # Attempt to recover from common parsing issues (e.g., extra tokens in options).
                raw_json = cls._extract_json_from_error(e)
                if raw_json:
                    logger.info(f"Attempting to sanitize and recover from: {raw_json}")
                    sanitized_json = cls.sanitize(raw_json)
                    try:
                        response = QuizSet(**sanitized_json)
                        logger.info("Recovery SUCCESSFUL via sanitization.")
                        break
                    except Exception as rex:
                        logger.error(f"Recovery failed. Sanitized output: {sanitized_json} | Error: {rex}")
                        pass

                if attempt == max_attempts:
                    logger.error(f"Max attempts reached. Failed to parse quiz for {path}")
                    raise

        duration = time.time() - start_time
        logger.info(f"END generation for quiz: {path} | Duration: {duration:.2f}s")

        if response is None or not hasattr(response, 'questions') or response.questions is None or len(response.questions) == 0:
            logger.error(f"Strict validation FAILED for {path}: Result is empty or malformed.")
            raise RuntimeError("Generated quiz is empty or malformed.")

        assert response is not None
        for question in (response.questions or []):
            embeddings = Utility.convert_text_to_embedding(question.answer)
            if embeddings is not None:
                question.answer_embedding = embeddings.tolist()

        cls.insert_data_db(
            path=path,
            data=response)

        return response

    @classmethod
    async def generate_response(cls, path) -> Optional[QuizSet]:
        from lib.lesson_store import MyLessonStore
        
        logger.info(f"Checking cache for quiz: {path}")
        quiz_set = cls.read_from_db(path)
        if quiz_set:
            logger.info(f"Cache HIT for quiz: {path}")
            return quiz_set
            
        logger.info(f"Cache MISS for quiz: {path}. Proceeding to generation.")
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        raise RuntimeError(f"Base lesson content not found or empty for path/ID: {path}. Cannot generate quiz.")

    @classmethod
    def insert_data_db(cls, path: str, data: QuizSet):
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
            print(f"Error: Database connection not initialized for Quiz: {path}")
            return

        try:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                conn.commit()
                print(f"Successfully saved Quiz: {path}")
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error saving Quiz: {e}")

    @classmethod
    def read_from_db(cls, path: str) -> Optional[QuizSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        
        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for Quiz read: {path}")
            return None

        try:
            with conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()

                if not row:
                    return None

                questions_json = row[0]

                # Reconstruct the Quiz object from the stored JSON list
                # This will automatically trigger the check_count validator
                return QuizSet(
                    questions=[Quiz(**q) for q in (questions_json or [])]
                )
        except Exception as e:
            print(f"Error reading Quiz: {e}")
            return None