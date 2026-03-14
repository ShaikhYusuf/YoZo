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

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import numpy as np
from langchain_ollama import OllamaLLM

from lib.data_ingestor import DataIngestor
from lib.utility import Utility
from lib.lesson_store import MyLessonStore
from lib.lesson_content import MyLessonContent
from lib.lesson_quiz import MyLessonQuiz
from lib.lesson_short_question import MyLessonShortQuestion
from lib.lesson_truefalse import MyLessonTrueFalse

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

limiter = Limiter(get_remote_address, app=app, default_limits=["30/minute"])

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


atexit.register(cleanup)


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
    ]

    for cls in classes_to_init:
        cls.initialize(llm, conn)

    logger.info("AI Service initialised successfully")
    return conn


# ================================================
# AI Content Routes
# ================================================
@app.route('/api/ai/content', methods=['GET'])
async def get_lesson_content():
    try:
        path = request.args.get('path')
        lesson_content = await MyLessonContent.generate_response(path)
        if lesson_content:
            return success_response(lesson_content.model_dump(), "Lesson content fetched successfully")
        return error_response("Content not found", 404)
    except Exception as e:
        logger.exception("Error fetching lesson content")
        return error_response(str(e))


@app.route('/api/ai/quiz', methods=['GET'])
async def get_lesson_quiz():
    try:
        path = request.args.get('path')
        lesson_quiz_set = await MyLessonQuiz.generate_response(path)
        if lesson_quiz_set:
            return success_response(lesson_quiz_set.model_dump(), "Quiz fetched successfully")
        return error_response("Content not found", 404)
    except Exception as e:
        logger.exception("Error fetching quiz")
        return error_response(str(e))


@app.route('/api/ai/truefalse', methods=['GET'])
async def get_lesson_true_false():
    try:
        path = request.args.get('path')
        lesson_true_false_set = await MyLessonTrueFalse.generate_response(path)
        if lesson_true_false_set:
            return success_response(lesson_true_false_set.model_dump(), "True/False fetched successfully")
        return error_response("Content not found", 404)
    except Exception as e:
        logger.exception("Error fetching true/false")
        return error_response(str(e))


@app.route('/api/ai/shortquestions', methods=['GET'])
async def get_lesson_short_questions():
    try:
        path = request.args.get('path')
        lesson_short_questions_set = await MyLessonShortQuestion.generate_response(path)
        if lesson_short_questions_set:
            return success_response(lesson_short_questions_set.model_dump(), "Short questions fetched successfully")
        return error_response("Content not found", 404)
    except Exception as e:
        logger.exception("Error fetching short questions")
        return error_response(str(e))


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
@app.route('/api/ai/hierarchy', methods=['GET'])
def get_lesson_hierarchy():
    try:
        hierarchy = MyLessonStore.read_hierarchy_with_scores()
        return success_response(
            [h.model_dump() for h in hierarchy],
            "Lesson hierarchy fetched successfully"
        )
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
# Health Check
# ================================================
@app.route('/health', methods=['GET'])
def health_check():
    return success_response({"status": "healthy"}, "AI Service is running")


if __name__ == "__main__":
    initialize_app()
    logger.info(f"Starting YoZo AI Service on port {FLASK_PORT}...")
    app.run(debug=FLASK_DEBUG, port=FLASK_PORT)
