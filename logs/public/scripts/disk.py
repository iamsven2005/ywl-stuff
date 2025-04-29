import subprocess
import socket
import requests

# --- Config ---
API_ENDPOINT = "http://PLACEHOLDER_IP:3000/api/disk"
DEVICE_HOST = socket.gethostname()

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
                    "host": DEVICE_HOST,
                    "name": device,
                    "label": mount,
                    "totalGB": to_gb(size),
                    "usedGB": to_gb(used),
                    "freeGB": to_gb(avail),
                })

    return parsed_disks

# --- Post disk usage data ---
def post_disk_usage():
    disks = parse_df_output()

    if not disks:
        print("⚠️ No valid disks found in df -h")
        return

    try:
        response = requests.post(API_ENDPOINT, json={"disks": disks}, timeout=5)
        response.raise_for_status()
        print("✅ Disks posted successfully:", response.json())
    except Exception as e:
        print("❌ API Post Error:", e)

# --- Entry point ---
if __name__ == "__main__":
    post_disk_usage()
