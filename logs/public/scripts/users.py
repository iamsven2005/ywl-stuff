import subprocess
import json
import requests
import getpass

API_ENDPOINT = "http://192.168.1.26:3000/api/users/"

def get_samba_users(sudo_password: str):
    try:
        # Run pdbedit with sudo, providing password via stdin
        result = subprocess.run(
            ["sudo", "-S", "pdbedit", "-L", "-v"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            input=sudo_password + "\n",
        )

        if result.returncode != 0:
            print("[ERROR] Failed to run pdbedit:", result.stderr.strip())
            return []

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

    except Exception as e:
        print("[ERROR] Exception while getting users:", e)
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
    sudo_pwd = getpass.getpass("Enter sudo password: ")

    samba_users = get_samba_users(sudo_pwd)
    if samba_users:
        print(f"[INFO] Found {len(samba_users)} Samba users.")
        send_users_to_api(samba_users)
    else:
        print("[INFO] No Samba users found or command failed.")
