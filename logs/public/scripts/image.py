import os
import glob
import requests
import socket

DEVICE_HOST = socket.gethostname()

# Define directory and pattern
pictures_dir = "/home/sven/Pictures"
pattern = os.path.join(pictures_dir, "Screenshot from *.png")

# Find all matching screenshots
screenshots = glob.glob(pattern)

# If no screenshots, exit
if not screenshots:
    print("No screenshots found.")
    exit(0)

# Get the latest screenshot by modified time
latest_screenshot = max(screenshots, key=os.path.getmtime)
server_url = "http://PLACEHOLDER_IP:3000/api/screenshot"  # Replace with actual IP

# Upload
try:
    with open(latest_screenshot, "rb") as f:
        files = {"file": ("screenshot.png", f, "image/png")}
        response = requests.post(server_url, files=files)
        if response.status_code == 200:
            print(f"Uploaded: {latest_screenshot}")
            os.remove(latest_screenshot)
            print("Deleted after upload.")
        else:
            print(f"Failed to upload. Status: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
