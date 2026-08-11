import subprocess
import time
import sys

def test_agent():
    print("🚀 Starting Fara Agent for testing...")
    process = subprocess.Popen(
        [sys.executable, "fara_computer_agent.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for initialization
    time.sleep(2)
    
    # Send 'n' for Safe Mode (or 'y' if we want unsafe, but 'n' is safer for test)
    print("🔒 Sending 'n' for Safe Mode...")
    process.stdin.write("n\n")
    process.stdin.flush()
    time.sleep(1)

    # Send a test message
    test_msg = "Hello! Which model are you running on?"
    print(f"📨 Sending message: {test_msg}")
    process.stdin.write(f"{test_msg}\n")
    process.stdin.flush()

    # Read output for a few seconds
    print("👀 Reading output...")
    start_time = time.time()
    while time.time() - start_time < 15:
        line = process.stdout.readline()
        if line:
            print(f"AGENT: {line.strip()}")
            if "Fara:" in line:
                print("✅ Received response from Fara!")
                break
        else:
            time.sleep(0.1)

    # Clean up
    print("🛑 Terminating agent...")
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()

if __name__ == "__main__":
    test_agent()
