import threading
import time
import schedule
import pyautogui
from PIL import Image

class AgentScheduler:
    def __init__(self, agent_core):
        self.agent = agent_core
        self.running = True
        self.jobs = []
        self.thread = threading.Thread(target=self._run_loop)
        self.thread.start()

    def _run_loop(self):
        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def add_schedule(self, interval_minutes, task_prompt):
        def job():
            print(f"[Scheduler] Running task: {task_prompt}")
            # We need to run this in a way that doesn't block the main agent if possible,
            # or minimally interferes. For now, we'll append to history but handling yields is tricky.
            # A simple approach: effectively 'inject' a user message.
            # But since 'chat' is a generator and might be active, this is complex.
            # Ideally, we should have an 'async_execute' in core.
            pass # Placeholder for now, integration in core needed.
        
        schedule.every(int(interval_minutes)).minutes.do(job)
        return f"Scheduled '{task_prompt}' every {interval_minutes} mins."

    def start_watch_dog(self, condition):
        # Watch dog runs in its own separate loop/thread to poll faster than scheduler
        t = threading.Thread(target=self._watch_dog_loop, args=(condition,))
        t.daemon = True
        t.start()
        return "Watch Dog active."

    def _watch_dog_loop(self, condition):
        print(f"[WatchDog] Started for: {condition}")
        while self.running:
            # 1. Capture Screen
            # For efficiency, we might crop or resize?
            screenshot = pyautogui.screenshot()
            
            # 2. Ask Vision Model (Quick check)
            # We access the agent's vision capability directly
            # Note: This might block other agent ops if model is single-threaded.
            # For a prototype, this is acceptable.
            res = self.agent._analyze_image_object(screenshot, f"True or False: Is '{condition}' visible or true in this image? Reply only 'TRUE' or 'FALSE'.")
            
            if "TRUE" in res.upper():
                print(f"[WatchDog] TRIGGERED: {condition}")
                # Alert User (System Beep + Message)
                print('\a') # Beep
                # self.agent.gui_callback(f"⚠️ WATCH DOG ALERT: {condition}")
                break
            
            time.sleep(5) # Poll every 5s

    def stop(self):
        self.running = False
