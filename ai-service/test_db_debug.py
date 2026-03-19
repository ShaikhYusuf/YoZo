import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_params = {
    "dbname": os.getenv("DB_NAME", "yozo"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
}

try:
    conn = psycopg2.connect(**db_params)
    with conn.cursor() as cur:
        # Check schemas
        cur.execute("SELECT schema_name FROM information_schema.schemata;")
        schemas = [r[0] for r in cur.fetchall()]
        print(f"Schemas found: {schemas}")
        
        # Check table in tenanta
        try:
            cur.execute("SELECT COUNT(*) FROM tenanta.lessonsection;")
            count = cur.fetchone()[0]
            print(f"tenanta.lessonsection count: {count}")
            
            cur.execute("SELECT \"Id\", name, explanation FROM tenanta.lessonsection LIMIT 1;")
            row = cur.fetchone()
            print(f"Sample row from tenanta.lessonsection: {row}")
        except Exception as e:
            print(f"Error querying tenanta.lessonsection: {e}")
            
    conn.close()
except Exception as e:
    print(f"Connection error: {e}")
