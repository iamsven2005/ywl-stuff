import os
import psycopg2
import time
from datetime import datetime

# PostgreSQL connection details
DB_CONFIG = {
    "dbname": "logs_database",
    "user": "admin",
    "password": "host-machine",
    "host": "192.168.1.26",
    "port": "5432"
}

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

            # **Ignore the logging command itself**
            if "ps aux --no-headers" in command or "/bin/sh -c ps aux --no-headers" in command:
                continue

            process_list[pid] = {
                "user": parts[0],
                "cpu": float(parts[2]),
                "mem": float(parts[3]),
                "command": command
            }
        print(f"[INFO] Retrieved {len(process_list)} running processes (excluding ignored ones).")
    except Exception as e:
        print(f"[ERROR] Failed to retrieve processes: {e}")
    return process_list

# Function to log changes in PostgreSQL
def log_process_change(action, pid, process_info):
    try:
        # **Skip logging processes related to 'ps aux --no-headers'**
        if "ps aux --no-headers" in process_info["command"] or "/bin/sh -c ps aux --no-headers" in process_info["command"]:
            print(f"[INFO] Ignored logging: {process_info['command']} (PID: {pid})")
            return

        print(f"[INFO] Connecting to database {DB_CONFIG['dbname']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        print(f"[INFO] Logging process {action}: PID {pid}, Command: {process_info['command']}")
        cursor.execute(
            """
            INSERT INTO logs.logs (action, name, pid, piuser, cpu, mem, command, host)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (action, "process", pid, process_info["user"], process_info["cpu"], process_info["mem"], process_info["command"], "__DEVICE_HOST__")
        )
        conn.commit()
        cursor.close()
        conn.close()
        print(f"[SUCCESS] Logged {action} event for PID {pid} successfully.")
    except Exception as e:
        print(f"[ERROR] Database Error: {e}")

# Monitor process changes
def monitor_processes():
    print("[INFO] Starting process monitoring...")
    previous_processes = get_processes()

    while True:
        time.sleep(5)  # Adjust polling interval as needed
        print("\n[INFO] Checking for process changes...")
        current_processes = get_processes()

        # Detect new processes
        for pid, info in current_processes.items():
            if pid not in previous_processes:
                print(f"[NEW] Process Started: {info['command']} (PID: {pid})")
                log_process_change("STARTED", pid, info)

        # Detect terminated processes
        for pid in previous_processes.keys():
            if pid not in current_processes:
                info = previous_processes[pid]
                print(f"[STOPPED] Process Stopped: {info['command']} (PID: {pid})")
                log_process_change("STOPPED", pid, info)

        previous_processes = current_processes

# Run the monitoring function
if __name__ == "__main__":
    print("[INFO] Process Monitoring Script Running...")
    monitor_processes()