import subprocess
import json
import requests

API_ENDPOINT = "http://192.168.1.26/api/users"

def get_samba_users():
    try:
        result = subprocess.run(["pdbedit", "-L", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        raw_output = result.stdout
        users = []

        user_block = {}
        for line in raw_output.splitlines():
            if not line.strip():
                if user_block:
                    users.append(user_block)
                    user_block = {}
                continue

            if ':' in line:
                key, value = line.split(':', 1)
                user_block[key.strip()] = value.strip()

        if user_block:
            users.append(user_block)

        return users

    except subprocess.CalledProcessError as e:
        print("[ERROR] Failed to run pdbedit:", e.stderr)
        return []

def send_users_to_api(users):
    try:
        response = requests.post(API_ENDPOINT, json={"users": users}, timeout=10)
        if response.status_code == 200:
            print("[SUCCESS] Users sent successfully.")
        else:
            print(f"[ERROR] Server responded with status {response.status_code}: {response.text}")
    except Exception as e:
        print("[ERROR] Failed to send users to API:", e)

if __name__ == "__main__":
    samba_users = get_samba_users()
    if samba_users:
        print(f"[INFO] Found {len(samba_users)} Samba users.")
        send_users_to_api(samba_users)
    else:
        print("[INFO] No Samba users found or command failed.")
