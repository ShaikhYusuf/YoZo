import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")

try:
    conn = psycopg2.connect(
        dbname=DB_NAME, 
        user=DB_USER, 
        password=DB_PASSWORD, 
        host=DB_HOST
    )
    cur = conn.cursor()
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    print("--- tables in public schema ---")
    for t in cur.fetchall():
        print(f"- {t[0]}")

    print("\n--- lesson_sections sample ---")
    try:
        cur.execute("SELECT path, content FROM lesson_sections LIMIT 5")
        rows = cur.fetchall()
        for r in rows:
            print(f"Path: {r[0]}, Content Length: {len(r[1]) if r[1] else 0}")
    except Exception as e:
        print(f"ERROR querying lesson_sections: {e}")
        conn.rollback()
    
    print("\n--- lesson_hierarchy sample ---")
    cur.execute("SELECT path, title, parent_path FROM lesson_hierarchy LIMIT 5")
    rows = cur.fetchall()
    for r in rows:
        print(f"Path: {r[0]}, Title: {r[1]}, Parent: {r[2]}")
        
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")
