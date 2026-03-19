import asyncio
import os
import psycopg2
from dotenv import load_dotenv
from langchain_ollama import OllamaLLM

# Mock classes to avoid full imports if needed, but easier to use real ones
from lib.lesson_quiz import MyLessonQuiz
from lib.lesson_store import MyLessonStore

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "ministral-3:3b")

async def test_generation():
    db_params = {
        "dbname": os.getenv("DB_NAME", "yozo"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
        "host": os.getenv("DB_HOST", "localhost"),
    }
    
    conn = psycopg2.connect(**db_params)
    conn.autocommit = True
    llm = OllamaLLM(model=MODEL_NAME, format="json", temperature=0)
    
    MyLessonStore.initialize(llm, conn)
    MyLessonQuiz.initialize(llm, conn)
    
    path = "1"
    print(f"Testing generation for path: {path}")
    
    # Check section read
    section = MyLessonStore.read_section_db(path)
    if section:
        print(f"Section found. Content length: {len(section.content)}")
    else:
        print("Section NOT found via MyLessonStore.read_section_db")
        return

    # Trigger generation
    print("Triggering generate_response...")
    result = await MyLessonQuiz.generate_response(path)
    
    if result:
        print(f"Generation SUCCEEDED. Questions count: {len(result.questions)}")
    else:
        print("Generation returned NONE")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(test_generation())
