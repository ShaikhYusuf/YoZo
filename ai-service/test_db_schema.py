import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")

def get_schema():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST
        )
        cur = conn.cursor()

        # No more schema printing

        print("\n--- public.ai_lesson_contents all rows ---")
        try:
            cur.execute("SELECT \"path\", substring(\"paragraph\" from 1 for 20) FROM public.ai_lesson_contents")
            rows = cur.fetchall()
            for r in rows:
                print(f"Path: {r[0]}, Para: {r[1]}...")
        except Exception as e:
            print(f"ERROR querying ai_lesson_contents: {e}")
            conn.rollback()
            
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    get_schema()
