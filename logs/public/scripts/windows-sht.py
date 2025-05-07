import os
import time
import socket
import requests
import pyautogui

# Get hostname and IP
hostname = socket.gethostname()
ip = socket.gethostbyname(hostname)

# Create screenshot filename and directory
timestamp = time.strftime("%Y%m%d_%H%M%S")
filename = f"screenshot_{hostname}_{timestamp}.png"
screenshot_dir = os.path.join(os.path.expanduser("~"), "Pictures", hostname)
os.makedirs(screenshot_dir, exist_ok=True)
screenshot_path = os.path.join(screenshot_dir, filename)

# Take screenshot
screenshot = pyautogui.screenshot()
screenshot.save(screenshot_path)
print(f"Screenshot saved to: {screenshot_path}")

# Upload to API
server_url = f"http://PLACEHOLDER_IP:3000/api/screenshot/{ip}"  # replace with real endpoint
print(server_url)
try:
    with open(screenshot_path, "rb") as f:
        files = {"file": (filename, f, "image/png")}
        response = requests.post(server_url, files=files)
        if response.status_code == 200:
            print("✅ Upload successful")
            os.remove(screenshot_path)
            print("🧹 Screenshot deleted after upload")
        else:
            print(f"❌ Upload failed: HTTP {response.status_code}")
except Exception as e:
    print(f"⚠️ Error uploading screenshot: {e}")
