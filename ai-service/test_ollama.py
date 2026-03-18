from langchain_ollama import OllamaLLM
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
MODEL_NAME = os.getenv("MODEL_NAME", "novaforgeai/llama3.2:3b-instruct:latest")

async def test_ollama():
    print(f"Testing model: {MODEL_NAME}")
    llm = OllamaLLM(model=MODEL_NAME, format="json", temperature=0)
    try:
        response = llm.invoke("Generate a JSON object with a key 'greeting' and value 'hello'.")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ollama())
