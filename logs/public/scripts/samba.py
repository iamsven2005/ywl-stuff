import os
import time
import psycopg2
from datetime import datetime

# PostgreSQL connection details
DB_CONFIG = {
    "dbname": "logs_database",
    "user": "admin",
    "password": "host-machine",
    "host": "192.168.1.26",
    "port": "5432"
}

LOG_FILE = "/var/log/samba/log.samba"  # Modify this path as needed

# Parse samba error line (adjust as needed)
def parse_log_line(line: str):
    if "WERR_DNS_ERROR_RECORD_ALREADY_EXISTS" not in line:
        return None

    try:
        timestamp = line.split(']')[0].strip('[')
        message = line.strip()
        return {
            "timestamp": timestamp,
            "message": message
        }
    except Exception as e:
        print(f"[ERROR] Failed to parse line: {e}")
        return None

# Insert log to database
def log_to_db(log_entry):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO logs.SambaLog (name, ipAddress, command, action, host)
            VALUES (%s, %s, %s, %s, %s,)
        """, (
            "samba",                         # name
            None,                            # ipAddress
            log_entry["message"],            # command
            "WERR_DNS_ERROR_RECORD_ALREADY_EXISTS",  # action
            "__SAMBA_HOST__"                 # host or replace with actual
        ))

        conn.commit()
        cursor.close()
        conn.close()
        print(f"[LOGGED] {log_entry['timestamp']}")
    except Exception as e:
        print(f"[DB ERROR] {e}")

# Monitor samba log file for changes
def monitor_samba_log():
    print(f"[INFO] Monitoring {LOG_FILE} for DNS errors...")
    with open(LOG_FILE, 'r') as f:
        # Go to the end of file
        f.seek(0, os.SEEK_END)

        while True:
            line = f.readline()
            if not line:
                time.sleep(1)
                continue

            entry = parse_log_line(line)
            if entry:
                print(f"[DETECTED] {entry['timestamp']} - {entry['message']}")
                log_to_db(entry)

if __name__ == "__main__":
    monitor_samba_log()
