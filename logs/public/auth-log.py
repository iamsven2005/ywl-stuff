import psycopg2
import inotify.adapters
DB_CONFIG = {
        "dbname":"logs_database",
        "user":"admin",
        "password":"host-machine",
        "host":"192.168.1.26",
        "port":"5432"
        }
def insert_log_entry(log_entry):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO logs.auth (log_entry, username) VALUES (%s, %s)", (log_entry, "__DEVICE_HOST__"))
        conn.commit()
        cursor.close()
        conn.close()
        print("Log Saved:", log_entry)
    except Exception as e:
        print("DB error:", e)
def follow_auth_log():
    logfile="/var/log/auth.log"
    with open(logfile, "r") as file:
        file.seek(0, 2)
        while True:
            line = file.readline()
            if line:
                insert_log_entry(line.strip())
def monitor_auth_log():
    notifier = inotify.adapters.Inotify()
    notifier.add_watch("/var/log/auth.log")
    print("Monitoring")
    for event in notifier.event_gen(yield_nones=False):
        (_, type_names, path, filename) = event
        if "IN_MODIFY" in type_names:
            follow_auth_log()
if __name__ == "__main__":
    monitor_auth_log()