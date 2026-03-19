import asyncio
import os
import psycopg2
from dotenv import load_dotenv
from langchain_ollama import OllamaLLM
from lib.lesson_content import MyLessonContent
from lib.lesson_store import MyLessonStore

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")

llm = OllamaLLM(model="ministral-3:3b", format="json", temperature=0)
conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)

MyLessonStore.initialize(llm, conn)
MyLessonContent.initialize(llm, conn)

async def main():
    print("Testing generate_response('1')...")
    res = await MyLessonContent.generate_response("1")
    print("Result:", type(res))

asyncio.run(main())
