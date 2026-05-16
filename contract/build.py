import sys
import subprocess
import os

def build():
    # Use the current python interpreter to run the compiler
    cmd = [
        sys.executable, "-m", "puyapy", 
        "smart_contracts/pay_per_ai/contract.py", 
        "--out-dir", "artifacts"
    ]
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        sys.exit(1)
    print("Build successful!")

if __name__ == "__main__":
    build()
