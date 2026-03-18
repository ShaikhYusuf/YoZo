import json
import numpy as np
from typing import Any
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate

from lib.utility import Utility

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
        if len(v) < 5:
            raise ValueError("The set must contain at least 5 questions.")
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
        for attempt in range(1, max_attempts + 1):
            try:
                response = chain.invoke({"paragraph": input_content_text})
                break
            except OutputParserException as e:
                # If the model produced fewer than the required number of questions,
                # retry with stronger instructions.
                if "must contain at least 5 questions" in str(e) and attempt < max_attempts:
                    reinforced_template = SHORT_QUESTION_PROMPT_TEMPLATE + "\n\nIMPORTANT: Your response MUST include exactly 5 questions in the 'questions' list."
                    prompt = PromptTemplate(
                        template=reinforced_template,
                        input_variables=["paragraph"],
                        partial_variables={"format_instructions": parser.get_format_instructions()}
                    )
                    chain = prompt | cls.llm | parser
                    continue
                raise

        if response is None or not hasattr(response, 'questions'):
            raise RuntimeError("Failed to generate short questions after multiple attempts.")

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
        
        question_answer_set = cls.read_from_db(path)
        if question_answer_set:
            return question_answer_set
            
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            print(f"On-demand generation triggered for short questions: {path}")
            return await cls.generate_contents(path, section.content)
            
        return None    

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

        if cls.conn is None:
            print(f"Error: Database connection not initialized for Short Questions: {path}")
            return

        try:
            with cls.conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                cls.conn.commit()
                print(f"Successfully saved Short Questions: {path}")
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            print(f"Error saving Short Questions: {e}")

    @classmethod
    def read_from_db(cls, path: str) -> Optional[ShortQuestionSet]:
        query = f"SELECT questions_json FROM {cls.table_name} WHERE path = %s"
        
        if cls.conn is None:
            print(f"Error: Database connection not initialized for Short Questions read: {path}")
            return None

        try:
            with cls.conn.cursor() as cur:
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