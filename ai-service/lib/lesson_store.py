from importlib.resources import path
import json
import logging
from pydantic import BaseModel
from typing import List, Optional, Any

from lib.lesson_content import MyLessonContent
from lib.lesson_match_column import MyLessonMatchColumn
from lib.lesson_quiz import MyLessonQuiz
from lib.lesson_short_question import MyLessonShortQuestion
from lib.lesson_truefalse import MyLessonTrueFalse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------- Data Models ------------------ #

class LessonSection(BaseModel):
    path: str
    content: str


class LessonScore(BaseModel):
    path: str
    quiz_score: int = 0
    truefalse_score: int = 0
    shortquestion_score: int = 0

class LessonHierarchy(BaseModel):
    path: str
    title: str
    parent_path: Optional[str] = None

class LessonHierarchyWithScore(BaseModel):
    path: str
    title: str
    parent_path: Optional[str] = None
    sections: List[LessonScore] = []
    
# ------------------- Lesson Store ------------------ #

class MyLessonStore():

    table_sections = "lesson_sections"
    table_scores = "lesson_scores"
    table_hierarchy = "lesson_hierarchy"

    conn: Any = None
    llm: Any = None

    @classmethod
    def initialize(cls, llm, conn):
        cls.llm = llm
        cls.conn = conn

    # ------------------------------------------------
    # Insert Book JSON
    # ------------------------------------------------
    @classmethod
    def insert_data_df(cls, book_json):

        create_sections = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_sections} (
            path TEXT PRIMARY KEY,
            content TEXT
        );
        """

        create_scores = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_scores} (
            path TEXT PRIMARY KEY,
            quiz_score INT DEFAULT 0,
            truefalse_score INT DEFAULT 0,
            shortquestion_score INT DEFAULT 0
        );
        """

        create_hierarchy = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_hierarchy} (
            path TEXT PRIMARY KEY,
            title TEXT,
            parent_path TEXT
        );
        """

        conn = cls.conn
        if conn is None:
            print("Error: Database connection not initialized.")
            return

        try:
            with conn.cursor() as cur:

                cur.execute(create_sections)
                cur.execute(create_scores)
                cur.execute(create_hierarchy)

                for item in book_json:

                    path = item["id"]
                    content = item["content"]

                    # -----------------------
                    # Topic
                    # -----------------------
                    if "-L" not in path:

                        cur.execute(
                            f"""
                            INSERT INTO {cls.table_hierarchy}
                            (path, title, parent_path)
                            VALUES (%s,%s,%s)
                            ON CONFLICT (path) DO NOTHING
                            """,
                            (path, content, None)
                        )

                    # -----------------------
                    # Lesson
                    # -----------------------
                    elif "-S" not in path:

                        topic_id = path.split("-")[0]

                        cur.execute(
                            f"""
                            INSERT INTO {cls.table_hierarchy}
                            (path, title, parent_path)
                            VALUES (%s,%s,%s)
                            ON CONFLICT (path) DO NOTHING
                            """,
                            (path, content, topic_id)
                        )

                    # -----------------------
                    # Section
                    # -----------------------
                    else:

                        lesson_id = "-".join(path.split("-")[:2])

                        # section content
                        cur.execute(
                            f"""
                            INSERT INTO {cls.table_sections}
                            (path, content)
                            VALUES (%s,%s)
                            ON CONFLICT (path)
                            DO UPDATE SET content = EXCLUDED.content
                            """,
                            (path, content)
                        )

                        # score table
                        cur.execute(
                            f"""
                            INSERT INTO {cls.table_scores}
                            (path)
                            VALUES (%s)
                            ON CONFLICT (path) DO NOTHING
                            """,
                            (path,)
                        )

                cls.conn.commit()

        except Exception as e:
            conn = cls.conn
            if conn:
                conn.rollback()
            print("Error inserting book:", e)

    # ------------------------------------------------
    # Read Section Content
    # ------------------------------------------------
    @classmethod
    def read_all_section_db(cls) -> Optional[List[LessonSection]]:

        query = f"""
        SELECT path, content
        FROM {cls.table_sections}
        """
        conn = cls.conn
        if conn is None:
            return None

        try:
            with conn.cursor() as cur:

                cur.execute(query)
                rows = cur.fetchall()

                if not rows:
                    return None

                return [LessonSection(
                    path=row[0],
                    content=row[1]
                ) for row in rows]

        except Exception as e:
            print("Error reading section:", e)
            return None

    @classmethod
    def read_section_db(cls, path_or_id) -> Optional[LessonSection]:
        
        # Determine if we are querying by integer Id or by string path (name)
        is_id = False
        try:
            int_id = int(path_or_id)
            is_id = True
        except (ValueError, TypeError):
            is_id = False

        if is_id:
            # Query by Id in tenanta schema
            query = """
            SELECT name, explanation
            FROM tenanta.lessonsection
            WHERE "Id" = %s
            """
            params = (int_id,)
        else:
            # Query by name (path) in tenanta schema
            query = """
            SELECT name, explanation
            FROM tenanta.lessonsection
            WHERE name = %s
            """
            params = (path_or_id,)

        conn = cls.conn
        if conn is None:
            return None

        try:
            logger.info(f"Attempting to read section: {path_or_id}")
            with conn.cursor() as cur:
                cur.execute(query, params)
                row = cur.fetchone()

                if not row:
                    logger.warning(f"Section {path_or_id} not found in tenanta.lessonsection, checking fallback...")
                    # Fallback to public schema for legacy support if needed
                    legacy_query = f"SELECT path, content FROM {cls.table_sections} WHERE path = %s"
                    cur.execute(legacy_query, (path_or_id,))
                    row = cur.fetchone()
                    if not row:
                        logger.error(f"Section {path_or_id} NOT found in any schema.")
                        return None

                logger.info(f"Successfully retrieved section: {path_or_id}")
                return LessonSection(
                    path=row[0],
                    content=row[1]
                )

        except Exception as e:
            logger.error(f"FAILED to read section ({path_or_id}): {e}", exc_info=True)
            if cls.conn:
                cls.conn.rollback()
            return None

    # ------------------------------------------------
    # Read Hierarchy
    # ------------------------------------------------
    @classmethod
    def read_hierarchy_db(cls) -> List[LessonHierarchy]:

        query = f"""
        SELECT path, title, parent_path
        FROM {cls.table_hierarchy}
        ORDER BY path
        """

        results: List[LessonHierarchy] = []

        conn = cls.conn
        if conn is None:
            return results

        try:
            with conn.cursor() as cur:

                cur.execute(query)

                rows = cur.fetchall()

                for r in rows:
                    results.append(
                        LessonHierarchy(
                            path=r[0],
                            title=r[1],
                            parent_path=r[2]
                        )
                    )

        except Exception as e:
            print("Error reading hierarchy:", e)

        return results

    # ------------------------------------------------
    # Read Score
    # ------------------------------------------------
    @classmethod
    def read_score_db(cls, path) -> Optional[LessonScore]:

        query = f"""
        SELECT path, quiz_score, truefalse_score, shortquestion_score
        FROM {cls.table_scores}
        WHERE path = %s
        """

        conn = cls.conn
        if conn is None:
            return None

        try:
            with conn.cursor() as cur:

                cur.execute(query, (path,))
                row = cur.fetchone()

                if not row:
                    return None

                return LessonScore(
                    path=row[0],
                    quiz_score=row[1],
                    truefalse_score=row[2],
                    shortquestion_score=row[3]
                )

        except Exception as e:
            print("Error reading score:", e)
            return None
        
    @classmethod
    async def generate_contents(cls, 
                            path: str, 
                            input_content_text: str
                            ) -> None:
        print(f"Generating Lesson Content for {path}...")
        content = MyLessonContent()
        content.initialize(cls.llm, cls.conn)
        content_response = await content.generate_contents(
            path, 
            input_content_text)
        
        response = await content.generate_response(path)
        print("Lesson Content Response:", response is not None)
        
        print(f"Generating Lesson Quiz for {path}...")
        content_quiz = MyLessonQuiz()
        content_quiz.initialize(cls.llm, cls.conn)
        content_quiz_response = await content_quiz.generate_contents(
            path, 
            input_content_text)
        response = await content_quiz.generate_response(path)
        print("Lesson Quiz Response:", response is not None)
        
        print(f"Generating Lesson Short Question for {path}...")
        content_shortquestion = MyLessonShortQuestion()
        content_shortquestion.initialize(cls.llm, cls.conn)
        content_shortquestion_response = await content_shortquestion.generate_contents(
            path, 
            input_content_text)
        response = await content_shortquestion.generate_response(path)
        print("Lesson Short Question Response:", response is not None)
        
        print(f"Generating Lesson True/False for {path}...")
        content_true_false = MyLessonTrueFalse()
        content_true_false.initialize(cls.llm, cls.conn)
        content_shortquestion_response = await content_true_false.generate_contents(
            path, 
            input_content_text)
        response = await content_true_false.generate_response(path)
        print("Lesson True/False Response:", response is not None)

    @classmethod
    def read_all_scores_db(cls) -> List[LessonScore]:

        query = f"""
        SELECT path, quiz_score, truefalse_score, shortquestion_score
        FROM {cls.table_scores}
        """

        results: List[LessonScore] = []

        conn = cls.conn
        if conn is None:
            return results

        try:
            with conn.cursor() as cur:

                cur.execute(query)
                rows = cur.fetchall()

                for r in rows:
                    results.append(
                        LessonScore(
                            path=r[0],
                            quiz_score=r[1],
                            truefalse_score=r[2],
                            shortquestion_score=r[3]
                        )
                    )

        except Exception as e:
            print("Error reading scores:", e)

        return results
    
    @classmethod
    def read_hierarchy_with_scores(cls) -> List[LessonHierarchyWithScore]:

        hierarchy = cls.read_hierarchy_db()
        scores = cls.read_all_scores_db()

        # convert hierarchy to dictionary
        hierarchy_map = {}

        for h in hierarchy:
            hierarchy_map[h.path] = LessonHierarchyWithScore(
                path=h.path,
                title=h.title,
                parent_path=h.parent_path,
                sections=[]
            )

        # attach scores to lessons
        for score in scores:

            parts = score.path.split("-")
            lesson_path = f"{parts[0]}-{parts[1]}" if len(parts) >= 2 else parts[0]

            if lesson_path in hierarchy_map:
                hierarchy_map[lesson_path].sections.append(score)

        return list(hierarchy_map.values())
    
    @classmethod
    def update_quiz_score(cls, path: str, quiz_score: int) -> bool:
        query = f"""
        UPDATE {cls.table_scores}
        SET quiz_score = %s
        WHERE path = %s
        """
        conn = cls.conn
        if conn is None:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(query, (quiz_score, path))
            conn.commit()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print("Error updating quiz score:", e)
            return False

    @classmethod
    def update_truefalse_score(cls, path: str, truefalse_score: int) -> bool:
        query = f"""
        UPDATE {cls.table_scores}
        SET truefalse_score = %s
        WHERE path = %s
        """
        conn = cls.conn
        if conn is None:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(query, (truefalse_score, path))
            conn.commit()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print("Error updating true/false score:", e)
            return False

    @classmethod
    def update_shortquestion_score(cls, path: str, shortquestion_score: int) -> bool:
        query = f"""
        UPDATE {cls.table_scores}
        SET shortquestion_score = %s
        WHERE path = %s
        """
        conn = cls.conn
        if conn is None:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(query, (shortquestion_score, path))
            conn.commit()
            return True
        except Exception as e:
            if conn:
                conn.rollback()
            print("Error updating short‑question score:", e)
            return False

    @classmethod
    def update_section_content(cls, path: str, content: str) -> bool:
        """Update the content of a lesson section (admin CMS)."""
        query = f"""
        UPDATE {cls.table_sections}
        SET content = %s
        WHERE path = %s
        """
        conn = cls.conn
        if conn is None:
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(query, (content, path))
            conn.commit()
            return cur.rowcount > 0 if hasattr(cur, 'rowcount') else True
        except Exception as e:
            if conn:
                conn.rollback()
            print("Error updating section content:", e)
            return False