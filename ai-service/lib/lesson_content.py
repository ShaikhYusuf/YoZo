import logging
import time
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)
from typing import List, Optional, Any
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.prompts import PromptTemplate

#------------------- Lesson Content Prompt Template ------------------#
CONTENT_PROMPT_TEMPLATE = """
You are a friendly primary school teacher. 
Your goal is to explain the provided paragraph to a 10-year-old child.

Instructions:
1. **Summary**: Provide a quick 2-3 sentence overview.
2. **Explanation**: Use simple words and fun analogies. Imagine you are explaining it to a kid who has never heard of this before.
3. **Examples**: Provide couple of clear, relatable examples from everyday life.

Paragraph:
{paragraph}

{format_instructions}
"""

#------------------- Lesson Content Data Model ------------------#
class LessonContent(BaseModel):
    # Use Optional and default to None so the Parser ignores it in the prompt instructions
    paragraph: Optional[str] = Field(default=None, exclude=True)
    explanation: str = Field(description="A simple, kid-friendly explanation using analogies.")
    summary: List [str] = Field(description="couple of high-level summary sentences.")
    examples: List [str] = Field(default_factory=list, description="2 simple, real-world examples.")

class MyLessonContent():
    table_name = "lesson_contents"
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

        # Ensure summary and examples are lists
        for field in ["summary", "examples"]:
            if field in raw and not isinstance(raw[field], list):
                if isinstance(raw[field], str):
                    raw[field] = [s.strip() for s in raw[field].split("\n") if s.strip()]
                else:
                    raw[field] = [str(raw[field])]
        
        if "explanation" not in raw:
            raw["explanation"] = "Explanation generation failed. Please try again."
        
        if "summary" not in raw: raw["summary"] = []
        if "examples" not in raw: raw["examples"] = []
            
        return raw

    @staticmethod
    def _extract_json_from_error(e: Exception) -> Optional[dict]:
        import re
        import json
        text = str(e)
        # Match the JSON object within the error message
        m = re.search(r"(\{.*?\})", text, re.DOTALL)
        if not m:
            m = re.search(r"(\{.*\})", text, re.DOTALL)
        
        if not m: return None
        try:
            return json.loads(m.group(1))
        except:
            return None

    @classmethod
    async def generate_contents(cls, path, input_content_text) -> LessonContent:
        parser = PydanticOutputParser(pydantic_object=LessonContent)
        prompt = PromptTemplate(
            template=CONTENT_PROMPT_TEMPLATE,
            input_variables=["paragraph"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )

        if cls.llm is None:
            raise RuntimeError("LLM not initialized. Call MyLessonContent.initialize(llm, conn) first.")

        # Assuming cls.llm is already initialized as shown in previous turns
        chain = prompt | cls.llm | parser

        max_attempts = 3
        response = None
        start_time = time.time()
        
        logger.info(f"START generation for lesson content: {path}")
        
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"LLM Invoke attempt {attempt}/{max_attempts} for path: {path}...")
                response = chain.invoke({"paragraph": input_content_text})
                logger.info(f"LLM Invoke SUCCESS for path: {path}.")
                break
            except OutputParserException as e:
                logger.warning(f"Output parsing failed on attempt {attempt}: {e}")
                
                raw_json = cls._extract_json_from_error(e)
                if raw_json:
                    logger.info(f"Attempting to sanitize and recover from: {raw_json}")
                    sanitized_json = cls.sanitize(raw_json)
                    try:
                        response = LessonContent(**sanitized_json)
                        logger.info("Recovery SUCCESSFUL.")
                        break
                    except Exception as rex:
                        logger.error(f"Recovery failed: {rex}")
                        pass

                if attempt == max_attempts:
                    logger.error(f"Max attempts reached. Failed to parse lesson content for {path}")
                    raise

        duration = time.time() - start_time
        logger.info(f"END generation for lesson content: {path} | Duration: {duration:.2f}s")

        if response is None or not hasattr(response, 'explanation') or not response.explanation:
            logger.error(f"Strict validation FAILED for {path}: Result is empty or malformed.")
            raise RuntimeError("Generated lesson content is empty or malformed.")

        if response is not None:
            response.paragraph = input_content_text
            if response.explanation and response.summary:
                summary_text = "\n".join(response.summary)
                full_script = (
                    f"Here is the explanation. {response.explanation}. "
                    f"To wrap up, here is the summary. {summary_text}"
                )
        
        cls.insert_data_db(
            path=path,
            data=response)

        return response

    @classmethod
    async def generate_response(cls, path: str) -> Optional[LessonContent]:
        from lib.lesson_store import MyLessonStore
        
        logger.info(f"Checking cache for AI lesson content: {path}")
        content = cls.read_data_db(path)
        if content:
            logger.info(f"Cache HIT for AI lesson content: {path}")
            return content
        
        logger.info(f"Cache MISS for AI lesson content: {path}. Proceeding to generation.")
        # If missing, try to generate it using base content from lesson_sections
        section = MyLessonStore.read_section_db(path)
        if section and section.content:
            return await cls.generate_contents(path, section.content)
            
        raise RuntimeError(f"Base lesson content not found or empty for path/ID: {path}. Cannot generate explanation.")

    @classmethod
    def insert_data_db(cls, path: str, data: LessonContent):
        # 1. Added UNIQUE constraint to the 'path' column
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_name} (
            id SERIAL PRIMARY KEY,
            path TEXT UNIQUE, 
            paragraph TEXT,
            explanation TEXT,
            summary TEXT,
            examples TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        # 2. Use ON CONFLICT to perform the UPDATE if the path already exists
        upsert_query = f"""
        INSERT INTO {cls.table_name} (path, paragraph, explanation, summary, examples)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (path) 
        DO UPDATE SET 
            paragraph = EXCLUDED.paragraph,
            explanation = EXCLUDED.explanation,
            summary = EXCLUDED.summary,
            examples = EXCLUDED.examples
        """

        values = (
            path, 
            data.paragraph,
            data.explanation,
            "\n".join(data.summary) if isinstance(data.summary, list) else data.summary,
            "\n".join(data.examples) if isinstance(data.examples, list) else data.examples
        )

        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for {path}")
            return

        try:
            with conn.cursor() as cur:
                cur.execute(create_table_query)
                cur.execute(upsert_query, values)
                conn.commit()
                print(f"Successfully processed (Upsert): {path}")
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error processing {path}: {e}")
            
    @classmethod
    def read_data_db(cls, path: str) -> Optional[LessonContent]:
        query = f"SELECT paragraph, explanation, summary, examples FROM {cls.table_name} WHERE path = %s"

        conn = cls.conn
        if conn is None:
            print(f"Error: Database connection not initialized for {path}")
            return None

        try:
            with conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()

                if not row:
                    return None

                paragraph, explanation, summary_str, examples_str = row

                return LessonContent(
                                    paragraph=paragraph,
                                    explanation=explanation,
                                    summary=summary_str.split("\n") if summary_str else [],
                                    examples=examples_str.split("\n") if examples_str else []
                                )    
        except Exception as e:
            print(f"Error reading {path}: {e}")
            if cls.conn:
                cls.conn.rollback()
            return None
