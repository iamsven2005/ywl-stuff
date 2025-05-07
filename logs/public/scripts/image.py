import os
import time
import socket
import requests
import subprocess

# --- Environment setup ---
os.environ["DISPLAY"] = ":1"  # or ":1" depending on your session
os.environ["XDG_RUNTIME_DIR"] = "/run/user/1000"
os.environ["DBUS_SESSION_BUS_ADDRESS"] = "unix:path=/run/user/1000/bus"

user_home = os.path.expanduser("~")
timestamp = time.strftime("%Y%m%d_%H%M%S")
filename = f"screenshot_{timestamp}.png"
screenshot_path = f"{user_home}/Pictures/{filename}"

# --- Take screenshot with custom filename ---
subprocess.run(["/usr/bin/gnome-screenshot", "-f", screenshot_path])

# --- Wait for file to be created ---
for _ in range(10):  # wait max 5 seconds
    if os.path.exists(screenshot_path):
        break
    time.sleep(0.5)
else:
    print(f"Error: Screenshot file not found after waiting: {screenshot_path}")
    exit(1)

# --- Upload ---
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
ip = s.getsockname()[0]
server_url = f"http://PLACEHOLDER_IP:3000/api/screenshot/{ip}"  # Replace with real IP

try:
    with open(screenshot_path, "rb") as f:
        files = {"file": (filename, f, "image/png")}
        response = requests.post(server_url, files=files)
        if response.status_code == 200:
            print(f"Uploaded: {screenshot_path}")
            os.remove(screenshot_path)
            print("Deleted after upload.")
        else:
            print(f"Failed to upload. Status: {response.status_code}")
except Exception as e:
    print(f"Upload error: {e}")
