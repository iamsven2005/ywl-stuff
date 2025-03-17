import os
import psycopg2
from datetime import datetime
import re  # ✅ Import regex module to clean sensor values

# PostgreSQL connection details
DB_CONFIG = {
    "dbname": "logs_database",
    "user": "admin",
    "password": "host-machine",
    "host": "192.168.1.26",
    "port": 5432
}

# Function to extract sensor data
def get_sensors_data():
    sensor_data = []
    sensors_output = os.popen("sensors").read()

    for line in sensors_output.split("\n"):
        if ":" in line:
            parts = line.split(":")
            sensor_name = parts[0].strip()
            value_part = parts[1].strip()

            # Skip non-numeric sensor names (e.g., "ISA adapter")
            if not any(char.isdigit() for char in value_part):
                continue  # ✅ Skip invalid data

            # ✅ Extract only the first numeric value (ignores additional text like "high =", "crit =", etc.)
            match = re.search(r"[-+]?\d*\.?\d+", value_part)
            if not match:
                print(f"Skipping invalid sensor value: {value_part}")
                continue

            cleaned_value = float(match.group())  # ✅ Convert extracted value to float

            # Determine value type
            if "°C" in value_part:
                value_type = "temperature"
            elif "RPM" in value_part:
                value_type = "fan_speed"
            elif "V" in value_part:
                value_type = "voltage"
            elif "W" in value_part:
                value_type = "power"
            else:
                value_type = "unknown"  # ✅ Handle unknown sensor types

            sensor_data.append((sensor_name, value_type, cleaned_value))

    return sensor_data

# Function to store data in PostgreSQL
def store_sensor_data():
    try:
        host = "host"  # ✅ Fixed invalid string quotes
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        sensor_data = get_sensors_data()

        for sensor_name, value_type, value in sensor_data:
            cursor.execute(
                """
                INSERT INTO logs.system_metrics (sensor_name, value_type, value, host)
                VALUES (%s, %s, %s, %s)
                """,
                (sensor_name, value_type, value, host)
            )

        conn.commit()
        cursor.close()
        conn.close()
        print("Sensor data logged successfully.")

    except Exception as e:
        print(f"Database Error: {e}")

# Run the function
if __name__ == "__main__":
    store_sensor_data()