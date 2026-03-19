import json
import re
import logging
import numpy as np

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate

from lib.utility import Utility

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
        if len(v) < 3: # Allowing at least 3
            raise ValueError("The set must contain at least 3 questions.")
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
        for attempt in range(1, max_attempts + 1):
            try:
                response = chain.invoke({"paragraph": input_content_text})
                break
            except OutputParserException:
                if attempt == max_attempts:
                    raise
                continue

        if response is None or not hasattr(response, 'questions'):
            raise RuntimeError("Failed to generate fill-blank questions.")

        cls.insert_data_db(path=path, data=response)
        return response

    @classmethod
    async def generate_response(cls, path) -> Optional[FillBlankSet]:
        from lib.lesson_store import MyLessonStore
        
        cached = cls.read_from_db(path)
        if cached:
            return cached
            
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        return None    

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
        if cls.conn:
            with cls.conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()
                if row:
                    return FillBlankSet(questions=[FillBlank(**q) for q in row[0]])
        return None
