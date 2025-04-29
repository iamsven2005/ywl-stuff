import os
import re
import socket
import requests

# --- Config ---
API_ENDPOINT = "http://192.168.1.26:3000/api/sensors"  # Replace with your backend server IP
DEVICE_HOST = socket.gethostname()

# --- Function to extract sensor data ---
def get_sensors_data():
    sensor_data = []
    sensors_output = os.popen("sensors").read()

    for line in sensors_output.split("\n"):
        if ":" in line:
            parts = line.split(":")
            sensor_name = parts[0].strip()
            value_part = parts[1].strip()

            # Skip non-numeric sensor outputs
            if not any(char.isdigit() for char in value_part):
                continue

            # Extract only the first numeric value
            match = re.search(r"[-+]?\d*\.?\d+", value_part)
            if not match:
                print(f"Skipping invalid sensor value: {value_part}")
                continue

            cleaned_value = float(match.group())

            # Determine sensor value type
            if "°C" in value_part:
                value_type = "temperature"
            elif "RPM" in value_part:
                value_type = "fan_speed"
            elif "V" in value_part:
                value_type = "voltage"
            elif "W" in value_part:
                value_type = "power"
            else:
                value_type = "unknown"

            sensor_data.append({
                "host": DEVICE_HOST,
                "sensor_name": sensor_name,
                "value_type": value_type,
                "value": cleaned_value,
            })

    return sensor_data

# --- Post sensor data to API ---
def post_sensor_data():
    sensor_data = get_sensors_data()

    if not sensor_data:
        print("⚠️ No valid sensors found")
        return

    try:
        res = requests.post(API_ENDPOINT, json={"sensors": sensor_data}, timeout=5)
        res.raise_for_status()
        print("✅ Sensor data posted successfully:", res.json())
    except Exception as e:
        print("❌ Failed to post sensor data:", e)

# --- Entry point ---
if __name__ == "__main__":
    post_sensor_data()
