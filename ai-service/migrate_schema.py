import json
import psycopg2
from typing import Any, Dict
import os
import sys

db_config = {
    "dbname": "yozo",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost"
}

def migrate_data():
    conn = psycopg2.connect(dbname=db_config["dbname"], user=db_config["user"], password=db_config["password"], host=db_config["host"])
    cur = conn.cursor()

    print("Starting migration from 'public' to 'tenanta' schema...")

    # 1. Clear existing tenanta curriculum data (Progress must go first due to FKs)
    cur.execute("DELETE FROM tenanta.progress;")
    cur.execute("DELETE FROM tenanta.lessonsection;")
    cur.execute("DELETE FROM tenanta.lesson;")
    cur.execute("DELETE FROM tenanta.subject;")
    
    # 2. Get all Topics (Subjects) from public.lesson_hierarchy
    # We assume paths like 'T01' are subjects.
    cur.execute("SELECT path, title FROM public.lesson_hierarchy WHERE path NOT LIKE '%-L%';")
    topics = cur.fetchall()

    subject_map: Dict[str, Any] = {} # Maps 'T01' -> Inserted Subject Id
    
    for t_path, t_title in topics:
        print(f"Migrating Subject: {t_title} ({t_path})")
        # Assume standard 1 exists (from seed.js)
        cur.execute("""
            INSERT INTO tenanta.subject (name, standard) 
            VALUES (%s, 1) RETURNING "Id";
        """, (t_title,))
        row = cur.fetchone()
        assert row is not None
        sub_id = row[0]
        subject_map[t_path] = sub_id

    # 3. Get all Lessons from public.lesson_hierarchy
    # We assume paths like 'T01-L01' are lessons.
    cur.execute("SELECT path, title, parent_path FROM public.lesson_hierarchy WHERE path LIKE '%-L%';")
    lessons = cur.fetchall()

    lesson_map: Dict[str, Any] = {} # Maps 'T01-L01' -> Inserted Lesson Id
    
    for l_path, l_title, parent_path in lessons:
        if parent_path in subject_map:
            sub_id = subject_map[parent_path]
            print(f"  Migrating Lesson: {l_title} ({l_path}) under Subject {sub_id}")
            cur.execute("""
                INSERT INTO tenanta.lesson (name, subject) 
                VALUES (%s, %s) RETURNING "Id";
            """, (l_title, sub_id))
            row = cur.fetchone()
            assert row is not None
            les_id = row[0]
            lesson_map[l_path] = les_id

    # 4. Get all Sections from public.lesson_sections
    # Paths like 'T01-L01-S01'. We need to extract the parent lesson path.
    cur.execute("SELECT path, content FROM public.lesson_sections;")
    sections = cur.fetchall()

    for s_path, content in sections:
        # parent path is everything before the last '-'
        if "-" in s_path:
            parent_path = s_path.rsplit("-", 1)[0]
        else:
            parent_path = s_path

        if parent_path in lesson_map:
            les_id = lesson_map[parent_path]
            
            # Find the subject ID by looking up the lesson's parent
            if "-" in parent_path:
                t_path = parent_path.rsplit("-", 1)[0]
            else:
                t_path = parent_path
            
            sub_id = subject_map.get(t_path)

            print(f"    Migrating Section: {s_path} under Lesson {les_id}")
            
            # Attempt to fetch AI generated questions if they exist. Since AI tables might be empty, we use COALESCE/LEFT JOIN manually or default to '[]'
            quiz_json = '[]'
            try:
                cur.execute("SELECT questions_json FROM public.ai_quizzes WHERE path = %s;", (s_path,))
                q_row = cur.fetchone()
                if q_row and q_row[0]: quiz_json = q_row[0]
            except: pass

            truefalse_json = '[]'
            try:
                cur.execute("SELECT questions_json FROM public.ai_truefalse WHERE path = %s;", (s_path,))
                tf_row = cur.fetchone()
                if tf_row and tf_row[0]: truefalse_json = tf_row[0]
            except: pass
            
            short_json = '[]'
            try:
                cur.execute("SELECT questions_json FROM public.ai_short_questions WHERE path = %s;", (s_path,))
                sq_row = cur.fetchone()
                if sq_row and sq_row[0]: short_json = sq_row[0]
            except: pass


            cur.execute("""
                INSERT INTO tenanta.lessonsection 
                (name, explanation, quiz, fillblanks, truefalse, subject, lesson) 
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (s_path, content, quiz_json, short_json, truefalse_json, sub_id, les_id))

    conn.commit()
    cur.close()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"Migration Failed: {e}")
