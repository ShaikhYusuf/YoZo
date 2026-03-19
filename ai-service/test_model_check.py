import ollama

try:
    models = ollama.list()
    print("Available Models:")
    found = False
    target = "novaforgeai/llama3.2:3b-optimized"
    for m in models['models']:
        name = getattr(m, 'name', m.get('name', 'unknown'))
        print(f"- {name}")
        if name == target:
            found = True
    
    if found:
        print(f"\nSUCCESS: Model '{target}' found.")
    else:
        print(f"\nFAILURE: Model '{target}' NOT found.")
except Exception as e:
    print(f"ERROR: {e}")
