import asyncio
import json
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add current directory to path so we can import lib
sys.path.append(os.getcwd())

from lib.lesson_store import MyLessonStore
from langchain_ollama import OllamaLLM

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
MODEL_NAME = os.getenv("MODEL_NAME", "novaforgeai/llama3.2:3b-optimized")

async def main():
    db_params = {
        "dbname": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "host": DB_HOST,
    }

    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)
    llm = OllamaLLM(model=MODEL_NAME, format="json", temperature=0)

    MyLessonStore.initialize(llm, conn)

    print("Fetching all lesson sections...")
    sections = MyLessonStore.read_all_section_db()

    if not sections:
        print("No sections found in database. Please run ingest_data.py first.")
        return

    print(f"Found {len(sections)} sections. Starting bulk generation...")

    for section in sections:
        path = section.path
        content_text = section.content
        
        print(f"\n--- Processing: {path} ---")
        try:
            # This triggers generation for Content, Quiz, Short Questions, and True/False
            await MyLessonStore.generate_contents(path, content_text)
            print(f"Successfully generated all content for {path}")
        except Exception as e:
            print(f"Error generating content for {path}: {e}")

    conn.close()
    print("\nBulk generation completed!")

if __name__ == "__main__":
    asyncio.run(main())
