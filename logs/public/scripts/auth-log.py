import inotify.adapters
import socket
import requests

API_ENDPOINT = "http://PLACEHOLDER_IP:3000/api/auth-log"
DEVICE_HOST = socket.gethostname()

def post_log_entry(log_entry):
    try:
        payload = {
            "log_entry": log_entry,
            "username": DEVICE_HOST
        }
        response = requests.post(API_ENDPOINT, json=payload, timeout=3)
        response.raise_for_status()
        print("✅ Log posted:", log_entry)
    except Exception as e:
        print("❌ API post error:", e)

def follow_auth_log():
    logfile = "/var/log/auth.log"
    with open(logfile, "r") as file:
        file.seek(0, 2)  # Move to end of file
        while True:
            line = file.readline()
            if line:
                post_log_entry(line.strip())

def monitor_auth_log():
    notifier = inotify.adapters.Inotify()
    notifier.add_watch("/var/log/auth.log")
    print("🔍 Monitoring /var/log/auth.log...")
    for event in notifier.event_gen(yield_nones=False):
        (_, type_names, path, filename) = event
        if "IN_MODIFY" in type_names:
            follow_auth_log()

if __name__ == "__main__":
    monitor_auth_log()
