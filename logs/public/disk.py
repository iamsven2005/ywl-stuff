import subprocess
import psycopg2
from datetime import datetime
import socket

# --- PostgreSQL connection config ---
DB_CONFIG = {
    "dbname": "logs_database",
    "user": "admin",
    "password": "host-machine",
    "host": "192.168.1.26",
    "port": "5432"
}

# --- Convert human-readable sizes to GB ---
def to_gb(size_str):
    units = {"K": 1 / (1024 ** 2), "M": 1 / 1024, "G": 1, "T": 1024}
    try:
        if size_str[-1] in units:
            value = float(size_str[:-1])
            return round(value * units[size_str[-1]], 2)
        else:
            return round(float(size_str) / (1024 ** 3), 2)  # assume bytes
    except Exception as e:
        print(f"⚠️ Failed to convert '{size_str}':", e)
        return 0.0

# --- Parse df -h output into structured data ---
def parse_df_output():
    result = subprocess.run(['df', '-h'], stdout=subprocess.PIPE, text=True)
    lines = result.stdout.strip().split('\n')
    headers = lines[0].split()
    entries = lines[1:]

    parsed_disks = []

    for line in entries:
        parts = line.split()
        if len(parts) >= 6:
            device, size, used, avail, use_percent, mount = parts[:6]
            if device.startswith('/dev/'):  # Only physical disks
                parsed_disks.append({
                    "name": device,
                    "label": mount,
                    "totalGB": to_gb(size),
                    "usedGB": to_gb(used),
                    "freeGB": to_gb(avail),
                })

    return parsed_disks

# --- Log disk usage to PostgreSQL ---
def log_disk_usage():
    hostname = socket.gethostname()
    disks = parse_df_output()

    if not disks:
        print("⚠️ No valid disks found in df -h")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        for disk in disks:
            cursor.execute("""
                INSERT INTO logs.diskmetric (host, name, label, totalGB, usedGB, freeGB)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                hostname,
                disk["name"],
                disk["label"],
                disk["totalGB"],
                disk["usedGB"],
                disk["freeGB"],
            ))
            print(f"✅ Logged {disk['name']} at {disk['label']} ({disk['usedGB']}/{disk['totalGB']} GB)")

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ All disk usage saved.\n")

    except Exception as e:
        print("❌ DB Error:", e)

# --- Entry point ---
if __name__ == "__main__":
    log_disk_usage()