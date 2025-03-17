import psutil
import psycopg2
from datetime import datetime

# PostgreSQL connection details
DB_CONFIG = {
    "dbname": "logs_database",
    "user": "admin",
    "password": "host-machine",
    "host": "192.168.1.26",
    "port": 5432
}

# Function to get memory usage
def get_memory_usage():
    mem = psutil.virtual_memory()
    return {
        "total_memory": mem.total,
        "used_memory": mem.used,
        "free_memory": mem.free,
        "available_memory": mem.available,
        "percent_usage": mem.percent
    }

# Function to store memory usage in PostgreSQL
def store_memory_usage():
    try:
        memory_data = get_memory_usage()
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO logs.memory_usage (total_memory, used_memory, free_memory, available_memory, percent_usage, host)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (memory_data["total_memory"], memory_data["used_memory"], memory_data["free_memory"], 
             memory_data["available_memory"], memory_data["percent_usage"], "host")
        )
        conn.commit()
        cursor.close()
        conn.close()
        print("Memory usage logged successfully.")

    except Exception as e:
        print(f"Database Error: {e}")

# Run the function
if __name__ == "__main__":
    store_memory_usage()