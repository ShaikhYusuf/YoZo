"""
YoZo AI Service — Lesson Notes Generator

Generates comprehensive lesson notes with media enrichment and PDF export.
Follows the existing MyLesson* classmethod pattern for consistency.

Pipeline: Read source → LLM expand → Fetch media → Assemble Markdown → Generate PDF → Save to DB
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════
#  PROMPT TEMPLATES
# ═════════════════════════════════════════════════════════════

NOTES_PROMPT_TEMPLATE = """
You are an expert educator creating comprehensive lesson notes for a primary school student (age 10-14).

SOURCE CONTENT:
{source_content}

Generate COMPLETE lesson notes as a JSON object with the following structure.

The JSON must have a "title" field and a "sections" field (array).
Each section must have: "heading" (string), "content" (string), and "type" (string).

Required sections (in this order):
1. type="introduction": 2-3 sentence overview of the topic.
2. type="explanation": 3-5 paragraphs using simple language, analogies, and comparisons.
3. type="steps": If the topic has a process, break it into numbered steps. Otherwise write key concepts.
4. type="examples": 2-3 concrete examples from everyday life a child would understand.
5. type="summary": 5-7 bullet points of the most important facts.
6. type="mistakes": 2-3 common misconceptions students have about this topic.

RULES:
- Use simple, friendly language (imagine explaining to a curious 10-year-old)
- Use analogies (e.g., "Think of DNA like a recipe book for your body")
- Each paragraph should be 3-5 sentences max
- Do NOT use complex jargon without explaining it first

{format_instructions}
"""

DIAGRAM_PROMPT_TEMPLATE = """
Based on the following lesson content, create 1-2 simple educational diagrams
that help a student visualize the core concept.

LESSON CONTENT:
{source_content}

For EACH diagram, provide:
1. A descriptive title
2. A caption (1-2 sentences explaining what the diagram shows)
3. A Mermaid.js diagram definition (flowchart TD, sequence, or mindmap)
4. An accessibility alt_text for screen readers

RULES:
- Mermaid code MUST be syntactically valid
- Quote node labels that contain special characters like parentheses
- Keep diagrams simple (max 8 nodes)
- Captions should explain WHAT the student should learn from the diagram

{format_instructions}
"""


# ═════════════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═════════════════════════════════════════════════════════════

class NotesSection(BaseModel):
    heading: str = Field(description="Section heading")
    content: str = Field(description="Section content in plain text or Markdown")
    type: str = Field(description="One of: introduction, explanation, steps, examples, summary, mistakes")


class ExpandedNotes(BaseModel):
    title: str = Field(description="A descriptive title for the notes")
    sections: List[NotesSection] = Field(description="List of note sections")


class DiagramDescription(BaseModel):
    title: str = Field(description="Descriptive diagram title")
    caption: str = Field(description="1-2 sentence explanation of what the diagram shows")
    mermaid_code: str = Field(description="Valid Mermaid.js diagram definition")
    alt_text: str = Field(description="Accessibility description for screen readers")


class DiagramOutput(BaseModel):
    diagrams: List[DiagramDescription] = Field(description="List of diagrams")


class LessonNotesResult(BaseModel):
    """Result returned to the caller after notes generation."""
    path: str
    title: str
    notes_json: Dict[str, Any]
    markdown: str
    pdf_path: Optional[str] = None
    status: str = "draft"
    version: int = 1


# ═════════════════════════════════════════════════════════════
#  MAIN CLASS
# ═════════════════════════════════════════════════════════════

class MyLessonNotes:
    """
    Generates, stores, and retrieves AI lesson notes with media.
    Follows the existing MyLesson* classmethod pattern.
    """

    table_name = "lesson_notes"
    llm: Any = None
    conn: Any = None

    @classmethod
    def initialize(cls, llm: Any, conn: Any) -> None:
        cls.llm = llm
        cls.conn = conn
        cls._ensure_table()

    @classmethod
    def _ensure_table(cls) -> None:
        """Create the lesson_notes table if it doesn't exist."""
        if cls.conn is None:
            return

        create_query = f"""
        CREATE TABLE IF NOT EXISTS {cls.table_name} (
            id          SERIAL PRIMARY KEY,
            path        TEXT UNIQUE NOT NULL,
            title       TEXT NOT NULL,
            notes_json  JSONB NOT NULL,
            markdown    TEXT,
            pdf_path    TEXT,
            status      VARCHAR(20) DEFAULT 'draft',
            version     INTEGER DEFAULT 1,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        try:
            with cls.conn.cursor() as cur:
                cur.execute(create_query)
                cls.conn.commit()
            logger.info(f"Table '{cls.table_name}' ensured.")
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            logger.error(f"Error creating table {cls.table_name}: {e}")

    # ─────────────────── PUBLIC API ───────────────────

    @classmethod
    async def generate_response(cls, path: str) -> Optional[LessonNotesResult]:
        """
        Main entry point: generate or retrieve notes for a given path.
        Matches the pattern used by MyLessonContent.generate_response().
        """
        logger.info(f"Notes requested for path: {path}")

        # 1. Check cache
        existing = cls._read_notes_db(path)
        if existing:
            logger.info(f"Notes found in cache for: {path}")
            return existing

        # 2. Read source content
        from lib.lesson_store import MyLessonStore
        section = MyLessonStore.read_section_db(path)
        if not section or not section.content:
            logger.error(f"No source content found for path: {path}")
            return None

        logger.info(f"Source content found ({len(section.content)} chars). Starting notes pipeline for: {path}")

        # 3. Run pipeline
        return await cls._run_pipeline(path, section.content)

    @classmethod
    async def publish_notes(cls, path: str) -> bool:
        """Set notes status to 'published'."""
        if cls.conn is None:
            return False

        try:
            with cls.conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {cls.table_name} SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE path = %s",
                    (path,),
                )
                cls.conn.commit()
                affected = cur.rowcount
            logger.info(f"Notes for '{path}' published (rows affected: {affected}).")
            return affected > 0
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            logger.error(f"Error publishing notes for {path}: {e}")
            return False

    @classmethod
    async def regenerate_notes(cls, path: str) -> Optional[LessonNotesResult]:
        """Delete existing notes and regenerate from scratch."""
        cls._delete_notes_db(path)

        from lib.lesson_store import MyLessonStore
        section = MyLessonStore.read_section_db(path)
        if not section or not section.content:
            logger.error(f"No source content found for path: {path}")
            return None

        return await cls._run_pipeline(path, section.content)

    # ─────────────────── PIPELINE STEPS ───────────────────

    @classmethod
    async def _run_pipeline(cls, path: str, source_content: str) -> Optional[LessonNotesResult]:
        """Full sequential pipeline: expand → diagrams → media → assemble → PDF → save."""
        try:
            # STEP 1: LLM — expand notes
            logger.info(f"[{path}] Step 1/6: Expanding notes with LLM...")
            expanded = cls._expand_notes(source_content)

            # STEP 2: LLM — generate diagram descriptions
            logger.info(f"[{path}] Step 2/6: Generating diagram descriptions...")
            diagrams = cls._generate_diagrams(source_content)

            # STEP 3: Fetch media (videos + images) — non-blocking
            logger.info(f"[{path}] Step 3/6: Fetching media...")
            videos, images = cls._fetch_media(expanded.title)

            # STEP 4: Assemble Markdown
            logger.info(f"[{path}] Step 4/6: Assembling Markdown...")
            notes_json = cls._build_notes_json(expanded, diagrams, videos, images)
            markdown_text = cls._assemble_markdown(expanded, diagrams, videos, images)

            # STEP 5: Generate PDF
            logger.info(f"[{path}] Step 5/6: Generating PDF...")
            pdf_path = cls._generate_pdf(path, markdown_text)

            # STEP 6: Save to DB
            logger.info(f"[{path}] Step 6/6: Saving to database...")
            result = LessonNotesResult(
                path=path,
                title=expanded.title,
                notes_json=notes_json,
                markdown=markdown_text,
                pdf_path=pdf_path,
                status="draft",
                version=1,
            )
            cls._upsert_notes_db(result)

            logger.info(f"[{path}] Notes generation complete!")
            return result

        except Exception as e:
            logger.exception(f"Pipeline failed for path {path}: {e}")
            raise

    @classmethod
    def _expand_notes(cls, source_content: str) -> ExpandedNotes:
        """Use LLM to generate structured notes from raw source content."""
        parser = PydanticOutputParser(pydantic_object=ExpandedNotes)
        prompt = PromptTemplate(
            template=NOTES_PROMPT_TEMPLATE,
            input_variables=["source_content"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )

        if cls.llm is None:
            raise RuntimeError("LLM not initialized. Call MyLessonNotes.initialize() first.")

        chain = prompt | cls.llm | parser

        max_attempts = 3
        last_error: Optional[Exception] = None

        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"LLM notes expansion attempt {attempt}/{max_attempts}...")
                result = chain.invoke({"source_content": source_content})
                logger.info(f"Notes expansion success: '{result.title}' with {len(result.sections)} sections.")
                return result
            except OutputParserException as e:
                last_error = e
                logger.warning(f"Attempt {attempt} parse error: {e}")
                if attempt < max_attempts:
                    time.sleep(1)
                    continue
                raise
            except Exception as e:
                last_error = e
                logger.error(f"Attempt {attempt} unexpected error: {e}")
                if attempt < max_attempts:
                    time.sleep(2 ** attempt)
                    continue
                raise

        raise RuntimeError(f"Notes expansion failed after {max_attempts} attempts: {last_error}")

    @classmethod
    def _generate_diagrams(cls, source_content: str) -> List[DiagramDescription]:
        """Use LLM to generate diagram descriptions."""
        parser = PydanticOutputParser(pydantic_object=DiagramOutput)
        prompt = PromptTemplate(
            template=DIAGRAM_PROMPT_TEMPLATE,
            input_variables=["source_content"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )

        if cls.llm is None:
            return []

        chain = prompt | cls.llm | parser

        try:
            result = chain.invoke({"source_content": source_content})
            logger.info(f"Generated {len(result.diagrams)} diagrams.")
            return result.diagrams
        except Exception as e:
            logger.warning(f"Diagram generation failed (non-fatal): {e}")
            return []  # Diagrams are optional — don't block the pipeline

    @classmethod
    def _fetch_media(cls, title: str) -> tuple:
        """Fetch videos and images using cascade fallback fetchers."""
        from lib.media_fetcher import fetch_images_with_fallback, fetch_videos_with_fallback

        videos = fetch_videos_with_fallback(title)
        images = fetch_images_with_fallback(title)
        return videos, images

    @classmethod
    def _build_notes_json(
        cls,
        expanded: ExpandedNotes,
        diagrams: List[DiagramDescription],
        videos: List[Dict],
        images: List[Dict],
    ) -> Dict[str, Any]:
        """Build the structured notes_json dict for DB storage."""
        return {
            "sections": [s.model_dump() for s in expanded.sections],
            "diagrams": [d.model_dump() for d in diagrams],
            "videos": videos,
            "images": images,
        }

    @classmethod
    def _assemble_markdown(
        cls,
        expanded: ExpandedNotes,
        diagrams: List[DiagramDescription],
        videos: List[Dict],
        images: List[Dict],
    ) -> str:
        """Assemble all content into a single Markdown document."""
        parts = [f"# {expanded.title}\n"]

        for section in expanded.sections:
            parts.append(f"## {section.heading}\n")
            parts.append(f"{section.content}\n")

        # Diagrams
        if diagrams:
            parts.append("## 📊 Diagrams\n")
            for diag in diagrams:
                parts.append(f"### {diag.title}\n")
                parts.append(f"```mermaid\n{diag.mermaid_code}\n```\n")
                parts.append(f"*{diag.caption}*\n")

        # Videos
        if videos:
            parts.append("## 🎬 Watch & Learn\n")
            for vid in videos:
                thumb = vid.get("thumbnail", "")
                if thumb:
                    parts.append(f"[![{vid['title']}]({thumb})]({vid['url']})\n")
                parts.append(f"**{vid['title']}** — {vid.get('channel', '')} ({vid.get('source', '')})\n")

        # Images
        if images:
            parts.append("## 🖼️ Visual References\n")
            for img in images:
                parts.append(f"![{img.get('alt', '')}]({img['url']})\n")
                parts.append(f"*{img.get('credit', '')}*\n")

        return "\n".join(parts)

    @classmethod
    def _generate_pdf(cls, path: str, markdown_text: str) -> Optional[str]:
        """Generate a PDF from the Markdown content."""
        try:
            from lib.pdf_generator import generate_pdf
            # Use path as filename, replacing slashes and special chars
            safe_filename = path.replace("/", "_").replace("\\", "_").replace(" ", "_")
            return generate_pdf(markdown_text, safe_filename)
        except Exception as e:
            logger.error(f"PDF generation failed (non-fatal): {e}")
            return None  # PDF failure should not block notes from being saved

    # ─────────────────── DATABASE OPERATIONS ───────────────────

    @classmethod
    def _upsert_notes_db(cls, result: LessonNotesResult) -> None:
        """Insert or update notes in the database."""
        upsert_query = f"""
        INSERT INTO {cls.table_name} (path, title, notes_json, markdown, pdf_path, status, version)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (path)
        DO UPDATE SET
            title = EXCLUDED.title,
            notes_json = EXCLUDED.notes_json,
            markdown = EXCLUDED.markdown,
            pdf_path = EXCLUDED.pdf_path,
            status = EXCLUDED.status,
            version = {cls.table_name}.version + 1,
            updated_at = CURRENT_TIMESTAMP
        """

        values = (
            result.path,
            result.title,
            json.dumps(result.notes_json),
            result.markdown,
            result.pdf_path,
            result.status,
            result.version,
        )

        if cls.conn is None:
            logger.error("Database connection not initialized.")
            return

        try:
            with cls.conn.cursor() as cur:
                cur.execute(upsert_query, values)
                cls.conn.commit()
            logger.info(f"Notes upserted for path: {result.path}")
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            logger.error(f"Error upserting notes for {result.path}: {e}")

    @classmethod
    def _read_notes_db(cls, path: str) -> Optional[LessonNotesResult]:
        """Read cached notes from the database."""
        query = f"""
        SELECT path, title, notes_json, markdown, pdf_path, status, version
        FROM {cls.table_name}
        WHERE path = %s
        """

        if cls.conn is None:
            return None

        try:
            with cls.conn.cursor() as cur:
                cur.execute(query, (path,))
                row = cur.fetchone()

                if not row:
                    return None

                path_val, title, notes_json_raw, markdown_val, pdf_path, status, version = row

                # notes_json_raw may be a dict (psycopg2 auto-parses JSONB) or a string
                if isinstance(notes_json_raw, str):
                    notes_json = json.loads(notes_json_raw)
                else:
                    notes_json = notes_json_raw

                return LessonNotesResult(
                    path=path_val,
                    title=title,
                    notes_json=notes_json,
                    markdown=markdown_val or "",
                    pdf_path=pdf_path,
                    status=status or "draft",
                    version=version or 1,
                )
        except Exception as e:
            logger.error(f"Error reading notes for {path}: {e}")
            return None

    @classmethod
    def _delete_notes_db(cls, path: str) -> None:
        """Delete notes from the database (used before regeneration)."""
        if cls.conn is None:
            return

        try:
            with cls.conn.cursor() as cur:
                cur.execute(f"DELETE FROM {cls.table_name} WHERE path = %s", (path,))
                cls.conn.commit()
            logger.info(f"Notes deleted for path: {path}")
        except Exception as e:
            if cls.conn:
                cls.conn.rollback()
            logger.error(f"Error deleting notes for {path}: {e}")
