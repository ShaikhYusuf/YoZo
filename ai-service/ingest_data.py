import json
import psycopg2
import os
import sys

# Add current directory to path so we can import lib
sys.path.append(os.getcwd())

from lib.lesson_store import MyLessonStore
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "dbname": os.getenv("DB_NAME", "yozo"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost")
}

try:
    conn = psycopg2.connect(dbname=db_config["dbname"], user=db_config["user"], password=db_config["password"], host=db_config["host"])
    MyLessonStore.initialize(None, conn) # LLM not needed for insertion

    # Path to os_book.json relative to ai-service directory
    json_path = os.path.join("..", "data-generation", "os_book.json")
    
    with open(json_path, "r", encoding="utf-8") as f:
        book_json = json.load(f)

    MyLessonStore.insert_data_df(book_json)
    print("Data ingested successfully!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
