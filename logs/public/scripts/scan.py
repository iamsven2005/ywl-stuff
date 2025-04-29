import psutil
import requests
import socket

# --- API Endpoint and Host ---
API_ENDPOINT = "http://PLACEHOLDER_IP:3000/api/scan"  # Replace with actual IP or domain
DEVICE_HOST = socket.gethostname()

# --- Get memory usage ---
def get_memory_usage():
    mem = psutil.virtual_memory()
    return {
        "total_memory": mem.total,
        "used_memory": mem.used,
        "free_memory": mem.free,
        "available_memory": mem.available,
        "percent_usage": mem.percent,
        "host": DEVICE_HOST,
    }

# --- Post memory usage to API ---
def post_memory_usage():
    data = get_memory_usage()

    try:
        res = requests.post(API_ENDPOINT, json=data, timeout=5)
        res.raise_for_status()
        print("✅ Memory usage posted successfully:", res.json())
    except Exception as e:
        print("❌ Failed to post memory usage:", e)

# --- Entry point ---
if __name__ == "__main__":
    post_memory_usage()
