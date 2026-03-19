from langchain_ollama import OllamaLLM
import time

model_name = "ministral-3:3b"
llm = OllamaLLM(model=model_name, temperature=0)

print(f"Testing OllamaLLM with model: {model_name}")
start_time = time.time()
try:
    response = llm.invoke("Explain photosynthesis in one sentence.")
    end_time = time.time()
    print(f"Response: {response}")
    print(f"Time taken: {end_time - start_time:.2f} seconds")
except Exception as e:
    print(f"ERROR: {e}")
