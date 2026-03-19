import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")

conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST)

def check_subjects():
    with psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT "Id", name, standard FROM "tenanta"."student" WHERE "Id" = 1')
            student = cur.fetchone()
            print(f"Student 1: {student}")
            
            cur.execute('SELECT "Id", name, "schoolStandardId" FROM "tenanta"."subject"')
            print("All Subjects:")
            for row in cur.fetchall():
                print(row)

check_subjects()
conn.close()
