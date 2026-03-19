"""
YoZo AI Service — Standalone Flask microservice for AI-powered content generation.

This service handles:
- Lesson content generation (LangChain + Ollama)
- Quiz/TrueFalse/ShortQuestion generation
- Text embedding comparison (SentenceTransformers)

It is called by the Node.js primary server via HTTP proxy routes.
"""

import atexit
import logging
import os
import sys

from dotenv import load_dotenv  # type: ignore
from flask import Flask, jsonify, request  # type: ignore
from flask_cors import CORS  # type: ignore
from flask_limiter import Limiter  # type: ignore
from flask_limiter.util import get_remote_address  # type: ignore
import numpy as np  # type: ignore
from langchain_ollama import OllamaLLM  # type: ignore

from lib.data_ingestor import DataIngestor  # type: ignore
from lib.utility import Utility  # type: ignore
from lib.lesson_store import MyLessonStore  # type: ignore
from lib.lesson_content import MyLessonContent  # type: ignore
from lib.lesson_quiz import MyLessonQuiz  # type: ignore
from lib.lesson_short_question import MyLessonShortQuestion  # type: ignore
from lib.lesson_truefalse import MyLessonTrueFalse  # type: ignore
from lib.lesson_fillblank import MyLessonFillBlank  # type: ignore
from lib.lesson_assistant import MyLessonAssistant  # type: ignore
from lib.lesson_notes import MyLessonNotes  # type: ignore
from lib.task_store import task_store, TaskStatus  # type: ignore

import asyncio

# ------------------------------------------------
# Configuration
# ------------------------------------------------
load_dotenv()

DB_NAME = os.getenv("DB_NAME", "yozo")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
MODEL_NAME = os.getenv("MODEL_NAME", "ministral-3:3b")
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))

# ------------------------------------------------
# Logging
# ------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ------------------------------------------------
# Flask App
# ------------------------------------------------
app = Flask(__name__)
CORS(app)

limiter = Limiter(get_remote_address, app=app, default_limits=["300/minute"])

_ingestor = None


# ------------------------------------------------
# Helpers
# ------------------------------------------------
def success_response(data, message="Success", status_code=200):
    return jsonify({"status": "success", "data": data, "message": message}), status_code


def error_response(message, status_code=500):
    return jsonify({"status": "error", "data": None, "message": message}), status_code


# ------------------------------------------------
# Error Handlers
# ------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return error_response("Resource not found", 404)


@app.errorhandler(500)
def internal_error(e):
    logger.exception("Unhandled server error")
    return error_response("Internal server error", 500)


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return error_response("Too many requests. Please slow down.", 429)


# ------------------------------------------------
# Lifecycle
# ------------------------------------------------
def cleanup():
    global _ingestor
    if _ingestor:
        logger.info("Closing database connection...")
        _ingestor.close()
        logger.info("Cleanup complete.")


atexit.register(cleanup)  # type: ignore


def initialize_app():
    """Initialises database connection and lesson classes."""
    db_params = {
        "dbname": DB_NAME,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "host": DB_HOST,
    }

    global _ingestor
    _ingestor = DataIngestor(db_params)
    conn = _ingestor.get_connection()
    llm = OllamaLLM(model=MODEL_NAME, format="json", temperature=0)

    classes_to_init = [
        MyLessonStore,
        MyLessonContent,
        MyLessonQuiz,
        MyLessonShortQuestion,
        MyLessonTrueFalse,
        MyLessonFillBlank,
        MyLessonAssistant,
        MyLessonNotes,
    ]

    for cls in classes_to_init:
        cls.initialize(llm, conn)

    logger.info("AI Service initialised successfully")
    return conn


# ================================================
# AI Content Routes (Task-Based Async)
# ================================================

def run_sync_in_thread(coro):
    """Bridge to run an async coroutine inside a synchronous background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@app.route('/api/ai/content', methods=['GET'])
def get_lesson_content():
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)
    
    task_id = task_store.create_task()
    # We pass the coroutine call to the thread
    task_store.run_async(task_id, run_sync_in_thread, MyLessonContent.generate_response(path))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route('/api/ai/quiz', methods=['GET'])
def get_lesson_quiz():
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)
    
    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonQuiz.generate_response(path))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route('/api/ai/fillblank', methods=['GET'])
def get_lesson_fillblank():
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)
    
    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonFillBlank.generate_response(path))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route('/api/ai/truefalse', methods=['GET'])
def get_lesson_true_false():
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)
    
    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonTrueFalse.generate_response(path))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route('/api/ai/shortquestions', methods=['GET'])
def get_lesson_short_questions():
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)
    
    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonShortQuestion.generate_response(path))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route('/api/ai/tasks/<task_id>', methods=['GET'])
def get_task_status(task_id):
    task = task_store.get_task(task_id)
    if not task:
        return error_response("Task not found", 404)
    
    # Create a copy for response
    response_data = task.copy()
    result = response_data.get("result")
    
    # Process Pydantic models in result if they exist
    if result:
        if hasattr(result, "model_dump"):
            response_data["result"] = result.model_dump()
        elif isinstance(result, list):
            response_data["result"] = [r.model_dump() if hasattr(r, "model_dump") else r for r in result]
            
    return success_response(response_data, "Task status fetched")


@app.route('/api/ai/chat', methods=['POST'])
def chat_with_assistant():
    data = request.get_json()
    path = data.get('path')
    question = data.get('prompt')
    if not path or not question:
        return error_response("path and prompt are required", 400)
    
    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonAssistant.generate_response(path, question))
    return success_response({"task_id": task_id}, "Task started", 202)

@app.route("/api/ai/compare", methods=["POST"])
def compare_text_to_embedding():
    try:
        data = request.get_json()
        text = data.get("text")
        embedding_list = data.get("embedding")
        if text is None or embedding_list is None:
            return error_response("text and embedding are required", 400)
        embedding = np.array(embedding_list)
        result = Utility.compare_text_to_embeddings(embedding, text)
        return success_response({"match": bool(result)}, "Comparison complete")
    except Exception as e:
        logger.exception("Error comparing text to embedding")
        return error_response(str(e))


# ================================================
# Lesson Hierarchy & Scores Routes
# ================================================
hierarchy_cache = {}

@app.route('/api/ai/hierarchy', methods=['GET'])
def get_lesson_hierarchy():
    try:
        if "data" in hierarchy_cache:
            return success_response(hierarchy_cache["data"], "Lesson hierarchy fetched from cache")

        hierarchy = MyLessonStore.read_hierarchy_with_scores()
        data = [h.model_dump() for h in hierarchy]
        hierarchy_cache["data"] = data
        return success_response(data, "Lesson hierarchy fetched successfully")
    except Exception as e:
        logger.exception("Error fetching lesson hierarchy")
        return error_response(str(e))


@app.route('/api/ai/scores', methods=['POST'])
def update_scores():
    try:
        data = request.get_json()
        path = data.get('path')
        if not path:
            return error_response("path is required", 400)

        results = {}
        score_fields = ['quiz_score', 'truefalse_score', 'short_question_score']
        if not any(field in data for field in score_fields):
            return error_response("No scores to update", 400)

        if 'quiz_score' in data:
            MyLessonStore.update_quiz_score(path, data['quiz_score'])
            results['quiz_score'] = 'updated'
        if 'truefalse_score' in data:
            MyLessonStore.update_truefalse_score(path, data['truefalse_score'])
            results['truefalse_score'] = 'updated'
        if 'short_question_score' in data:
            MyLessonStore.update_shortquestion_score(path, data['short_question_score'])
            results['short_question_score'] = 'updated'

        # Invalidate cache when scores update
        hierarchy_cache.clear()

        return success_response({"updated": results}, "Scores updated successfully")
    except Exception as e:
        logger.exception("Error updating scores")
        return error_response(str(e))



@app.route('/api/ai/scores/all', methods=['GET'])
def get_all_scores():
    try:
        scores = MyLessonStore.read_all_scores_db()
        return success_response(
            [s.model_dump() for s in scores],
            "Scores fetched"
        )
    except Exception as e:
        logger.exception("Error fetching scores")
        return error_response(str(e))


# ================================================
# Lesson Notes Routes
# ================================================

@app.route('/api/ai/notes', methods=['GET'])
def get_lesson_notes():
    """Generate or retrieve AI lesson notes for a given path."""
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)

    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonNotes.generate_response(path))
    return success_response({"task_id": task_id}, "Notes generation started", 202)


@app.route('/api/ai/notes/pdf', methods=['GET'])
def get_notes_pdf():
    """Serve the generated PDF file for a given notes path."""
    from flask import send_file
    path = request.args.get('path')
    if not path:
        return error_response("path is required", 400)

    try:
        notes = MyLessonNotes._read_notes_db(path)
        if not notes or not notes.pdf_path:
            return error_response("PDF not found for this path", 404)

        if not os.path.exists(notes.pdf_path):
            return error_response("PDF file missing from disk", 404)

        safe_filename = path.replace("/", "_").replace("\\", "_") + "_notes.pdf"
        return send_file(
            notes.pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=safe_filename,
        )
    except Exception as e:
        logger.exception("Error serving PDF")
        return error_response(str(e))


@app.route('/api/ai/notes/publish', methods=['POST'])
def publish_notes():
    """Set notes status from draft → published."""
    data = request.get_json()
    if not data or not data.get('path'):
        return error_response("path is required", 400)

    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonNotes.publish_notes(data['path']))
    return success_response({"task_id": task_id}, "Publish task started", 202)


@app.route('/api/ai/notes/regenerate', methods=['POST'])
def regenerate_notes():
    """Delete existing notes and regenerate from scratch."""
    data = request.get_json()
    if not data or not data.get('path'):
        return error_response("path is required", 400)

    task_id = task_store.create_task()
    task_store.run_async(task_id, run_sync_in_thread, MyLessonNotes.regenerate_notes(data['path']))
    return success_response({"task_id": task_id}, "Regeneration started", 202)


# ================================================
# Health Check
# ================================================
@app.route('/health', methods=['GET'])
def health_check():
    return success_response({"status": "healthy"}, "AI Service is running")


if __name__ == "__main__":
    initialize_app()
    logger.info(f"Starting YoZo AI Service on port {FLASK_PORT}...")
    app.run(debug=FLASK_DEBUG, port=FLASK_PORT)
