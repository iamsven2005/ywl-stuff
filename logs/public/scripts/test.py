import os
import time
import requests
import socket

# --- Configuration ---
API_ENDPOINT = "http://192.168.1.26:3000/api/pid"  # Replace with your backend IP/hostname
DEVICE_HOST = socket.gethostname()

# Function to get the list of current processes
def get_processes():
    process_list = {}
    try:
        result = os.popen("ps aux --no-headers").read().strip().split("\n")
        for line in result:
            parts = line.split(None, 10)
            if len(parts) < 11:
                continue
            pid = int(parts[1])
            command = parts[10]

            # Ignore self-logging
            if "ps aux --no-headers" in command or "/bin/sh -c ps aux --no-headers" in command:
                continue

            process_list[pid] = {
                "user": parts[0],
                "cpu": float(parts[2]),
                "mem": float(parts[3]),
                "command": command,
            }
    except Exception as e:
        print(f"[ERROR] Failed to retrieve processes: {e}")
    return process_list

# Function to POST changes to /api/pid
def post_process_change(action, pid, process_info):
    if "ps aux --no-headers" in process_info["command"]:
        return

    data = {
        "host": DEVICE_HOST,
        "pid": pid,
        "action": action,
        "user": process_info["user"],
        "cpu": process_info["cpu"],
        "mem": process_info["mem"],
        "command": process_info["command"],
    }

    try:
        res = requests.post(API_ENDPOINT, json=data, timeout=5)
        res.raise_for_status()
        print(f"[✅] {action} PID {pid} - {process_info['command']}")
    except Exception as e:
        print(f"[❌] Failed to POST process change: {e}")

# Monitor process changes
def monitor_processes():
    print("[INFO] Starting process monitoring...")
    previous_processes = get_processes()

    while True:
        time.sleep(5)
        current_processes = get_processes()

        for pid, info in current_processes.items():
            if pid not in previous_processes:
                post_process_change("STARTED", pid, info)

        for pid in previous_processes.keys():
            if pid not in current_processes:
                post_process_change("STOPPED", pid, previous_processes[pid])

        previous_processes = current_processes

if __name__ == "__main__":
    print("[INFO] Process Monitoring Script Running...")
    monitor_processes()
