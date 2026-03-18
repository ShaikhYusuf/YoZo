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

logging.basicConfig(level=logging.INFO)

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
        if len(v) < 5:
            raise ValueError("The set must contain at least 5 questions.")
        return v

class MyLessonQuiz():
    table_name = "multiple_choice_quizzes"
    llm: Any = None
    conn: Any = None

    @staticmethod
    def sanitize(raw: dict) -> dict:
        if "questions" not in raw:
            return raw

        cleaned = []
        for q in raw["questions"]:
            options_raw = q.get("options", [])
            if not isinstance(options_raw, list):
                options_raw = list(options_raw) if hasattr(options_raw, "__iter__") else []
            
            # Use explicit list constructor to avoid Pyre slicing confusion
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
        for attempt in range(1, max_attempts + 1):
            try:
                response = chain.invoke({"paragraph": input_content_text})
                break
            except OutputParserException as e:
                # If the model produced fewer than the required number of questions,
                # retry with stronger instructions.
                if "must contain at least 5 questions" in str(e) and attempt < max_attempts:
                    reinforced_template = QUIZ_PROMPT_TEMPLATE + "\n\nIMPORTANT: Your response MUST include exactly 5 questions in the 'questions' list."
                    prompt = PromptTemplate(
                        template=reinforced_template,
                        input_variables=["paragraph"],
                        partial_variables={"format_instructions": parser.get_format_instructions()}
                    )
                    chain = prompt | cls.llm | parser
                    continue

                # Attempt to recover from common parsing issues (e.g., extra tokens in options).
                raw_json = cls._extract_json_from_error(e)
                if raw_json:
                    raw_json = cls.sanitize(raw_json)
                    try:
                        response = QuizSet(**raw_json)
                        break
                    except Exception:
                        pass

                # If we can't recover, raise to surface the parsing issue.
                raise

        if response is None or not hasattr(response, 'questions') or response.questions is None:
            raise RuntimeError("Failed to generate quiz or questions missing after multiple attempts.")

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
        
        quiz_set = cls.read_from_db(path)
        if quiz_set:
            return quiz_set
            
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            print(f"On-demand generation triggered for quiz: {path}")
            return await cls.generate_contents(path, section.content)
            
        return None    

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

        if cls.conn is None:
            print(f"Error: Database connection not initialized for Quiz: {path}")
            return

        try:
            with cls.conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                cls.conn.commit()
                print(f"Successfully saved Quiz: {path}")
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            print(f"Error saving Quiz: {e}")

    @classmethod
    def read_from_db(cls, path: str) -> Optional[QuizSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        
        if cls.conn is None:
            print(f"Error: Database connection not initialized for Quiz read: {path}")
            return None

        try:
            with cls.conn.cursor() as cur:
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