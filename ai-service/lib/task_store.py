import threading
import uuid
import time
from enum import Enum
from typing import Dict, Any, Optional

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskStore:
    """Simple in-memory task store with background execution logic."""
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "id": task_id,
            "status": TaskStatus.PENDING.value,
            "result": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time()
        }
        return task_id

    def update_task(self, task_id: str, status: TaskStatus, result: Any = None, error: Optional[str] = None):
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = status.value
            self.tasks[task_id]["updated_at"] = time.time()
            if result is not None:
                self.tasks[task_id]["result"] = result
            if error is not None:
                self.tasks[task_id]["error"] = error

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.tasks.get(task_id)

    def run_async(self, task_id: str, func, *args, **kwargs):
        """Runs a function in a background thread and updates task status."""
        import logging
        logger = logging.getLogger(__name__)

        def wrapper():
            import asyncio
            import inspect
            try:
                logger.info(f"Task {task_id} status: RUNNING")
                self.update_task(task_id, TaskStatus.RUNNING)
                
                # Check if it's an async function
                if inspect.iscoroutinefunction(func):
                    result = asyncio.run(func(*args, **kwargs))
                else:
                    result = func(*args, **kwargs)
                
                logger.info(f"Task {task_id} status: COMPLETED")
                self.update_task(task_id, TaskStatus.COMPLETED, result=result)
            except Exception as e:
                logger.error(f"Task {task_id} status: FAILED | Error: {str(e)}")
                self.update_task(task_id, TaskStatus.FAILED, error=str(e))

        thread = threading.Thread(target=wrapper)
        thread.start()

task_store = TaskStore()
