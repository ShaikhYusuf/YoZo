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

logger = logging.getLogger(__name__)

#------------------- Fill Blank Template ------------------#
FILLBLANK_PROMPT_TEMPLATE = """
You are an expert educator.

Your task is to generate a 'Fill in the Blank' quiz STRICTLY following the schema.

RULES (VERY IMPORTANT):
1. Generate EXACTLY 5 questions.
2. Each question MUST contain a placeholder '______' where the blank should be.
3. Each question MUST contain EXACTLY 4 options.
4. The options MUST be short (1-3 words).
5. The "answer" MUST be the index (0, 1, 2, or 3) of the correct option in the "options" list.
6. NEVER generate more than 4 options.
7. Output ONLY valid JSON.

Paragraph:
{paragraph}

{format_instructions}
"""

# ------------------- Fill Blank Data Model ------------------#
class FillBlank(BaseModel):
    question: str = Field(description="The question text containing '______' as a placeholder.")
    options: List[str] = Field(description="A list of exactly 4 options.", min_length=4, max_length=4)
    answer: int = Field(description="The 0-based index of the correct option in the options list.")

class FillBlankSet(BaseModel):
    questions: List[FillBlank] = Field(description="A list of fill-in-the-blank questions.")
    
    @field_validator('questions')
    @classmethod
    def check_count(cls, v):
        if len(v) < 1:
            raise ValueError("The set must contain at least 1 question.")
        return v

class MyLessonFillBlank():
    table_name = "fill_blank_questions"
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
                logger.info("Sanitizer: Detected single FillBlank object, wrapping in 'questions' list.")
                raw = {"questions": [raw]}
            else:
                for k, v in raw.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "question" in v[0]:
                        logger.info(f"Sanitizer: Found FillBlank questions in key '{k}', remapping to 'questions'.")
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
            
            # Options fixup
            opts = q.get("options", [])
            if not isinstance(opts, list): opts = [str(opts)]
            while len(opts) < 4: opts.append("Unknown")
            q["options"] = opts[:4]

            # Answer index fixup
            ans = q.get("answer", 0)
            try:
                q["answer"] = int(ans) % 4
            except:
                q["answer"] = 0
            
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
    async def generate_contents(cls, path, input_content_text) -> FillBlankSet:
        parser = PydanticOutputParser(pydantic_object=FillBlankSet)
        prompt = PromptTemplate(
            template=FILLBLANK_PROMPT_TEMPLATE,
            input_variables=["paragraph"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        chain = prompt | cls.llm | parser

        max_attempts = 3
        response: Any = None
        start_time = time.time()

        logger.info(f"START generation for fill-blank: {path}")

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
                        response = FillBlankSet(**sanitized_json)
                        logger.info("Recovery SUCCESSFUL.")
                        break
                    except Exception as rex:
                        logger.error(f"Recovery failed: {rex}")
                        pass

                if attempt == max_attempts:
                    logger.error(f"Max attempts reached. Failed to parse fill-blank for {path}")
                    raise

        duration = time.time() - start_time
        logger.info(f"END generation for fill-blank: {path} | Duration: {duration:.2f}s")

        if response is None or not hasattr(response, 'questions') or response.questions is None or len(response.questions) == 0:
            logger.error(f"Strict validation FAILED for {path}: Result is empty or malformed.")
            raise RuntimeError("Generated fill-blank questions are empty or malformed.")

        cls.insert_data_db(path=path, data=response)
        return response

    @classmethod
    async def generate_response(cls, path) -> Optional[FillBlankSet]:
        from lib.lesson_store import MyLessonStore
        
        logger.info(f"Checking cache for fill-blank: {path}")
        cached = cls.read_from_db(path)
        if cached:
            logger.info(f"Cache HIT for fill-blank: {path}")
            return cached
            
        logger.info(f"Cache MISS for fill-blank: {path}. Proceeding to generation.")
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        raise RuntimeError(f"Base lesson content not found or empty for path/ID: {path}. Cannot generate fill-blank questions.")

    @classmethod
    def insert_data_db(cls, path: str, data: FillBlankSet):
        create_table = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_name} (
            id SERIAL PRIMARY KEY,
            path TEXT UNIQUE,
            questions_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        upsert = f"""
        INSERT INTO {cls.table_name} (path, questions_json)
        VALUES (%s, %s)
        ON CONFLICT (path) DO UPDATE SET questions_json = EXCLUDED.questions_json;
        """
        questions_data = [q.model_dump() for q in data.questions]
        
        if cls.conn:
            with cls.conn.cursor() as cur:
                cur.execute(create_table)
                cur.execute(upsert, (path, json.dumps(questions_data)))
                cls.conn.commit()

    @classmethod
    def read_from_db(cls, path: str) -> Optional[FillBlankSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        try:
            if cls.conn:
                with cls.conn.cursor() as cur:
                    cur.execute(query, (path,))
                    row = cur.fetchone()
                    if row:
                        return FillBlankSet(questions=[FillBlank(**q) for q in row[0]])
        except Exception as e:
            print(f"Error reading FillBlank: {e}")
            if cls.conn:
                cls.conn.rollback()
        return None
