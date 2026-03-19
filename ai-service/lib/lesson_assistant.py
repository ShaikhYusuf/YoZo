import json
import logging
from typing import Any, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

# ------------------- Chat Assistant Template ------------------#
CHAT_ASSISTANT_PROMPT_TEMPLATE = """
You are a friendly and helpful Study Assistant for a student learning platform called YoZo.

You have access to the following lesson content that the student is currently studying:

--- LESSON CONTENT ---
{lesson_context}
--- END LESSON CONTENT ---

The student asks the following question:
{question}

RULES:
1. Answer the question based PRIMARILY on the lesson content above.
2. If the question is unrelated to the lesson, you may still answer helpfully but gently guide the student back to the topic.
3. Use simple, student-friendly language.
4. Keep answers concise but informative (2-4 sentences preferred).
5. If appropriate, give a small example to illustrate your point.
6. Output your answer as valid JSON with a single key "answer" containing your response text.

Respond ONLY with valid JSON:
{{"answer": "your helpful response here"}}
"""

# ------------------- Chat Response Model ------------------#
class ChatResponse(BaseModel):
    answer: str = Field(description="The assistant's response to the student's question.")

class MyLessonAssistant():
    llm: Any = None
    conn: Any = None

    @classmethod
    def initialize(cls, llm, conn):
        cls.llm = llm
        cls.conn = conn

    @classmethod
    async def generate_response(cls, path: str, question: str) -> Optional[ChatResponse]:
        """Generate a chat response using the lesson content as context."""
        from lib.lesson_store import MyLessonStore

        # Get the lesson content for context
        section = MyLessonStore.read_section_db(path)
        lesson_context = ""
        if section and section.content:
            lesson_context = section.content
        else:
            lesson_context = "No lesson content available for this section."

        prompt = PromptTemplate(
            template=CHAT_ASSISTANT_PROMPT_TEMPLATE,
            input_variables=["lesson_context", "question"]
        )

        if cls.llm is None:
            raise RuntimeError("LLM not initialized. Call MyLessonAssistant.initialize() first.")

        chain = prompt | cls.llm

        try:
            raw_response = chain.invoke({
                "lesson_context": lesson_context,
                "question": question
            })

            # Parse the JSON response
            if isinstance(raw_response, str):
                parsed = json.loads(raw_response)
                return ChatResponse(answer=parsed.get("answer", raw_response))
            return ChatResponse(answer=str(raw_response))
        except json.JSONDecodeError:
            # If JSON parsing fails, use the raw text
            if isinstance(raw_response, str):
                return ChatResponse(answer=raw_response)
            return ChatResponse(answer=str(raw_response))
        except Exception as e:
            logger.exception(f"Error generating chat response: {e}")
            return ChatResponse(answer=f"I'm sorry, I had trouble understanding that. Could you rephrase your question?")
