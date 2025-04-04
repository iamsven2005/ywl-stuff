import subprocess
import json
import requests

# Hardcoded sudo password (⚠️ for internal use only)
SUDO_PASSWORD = "PW^316>mn"
API_ENDPOINT = "http://192.168.1.26:3000/api/users"

def run_sudo_command(command: list):
    try:
        result = subprocess.run(
            ["sudo", "-S"] + command,
            input=SUDO_PASSWORD + "\n",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.returncode != 0:
            print(f"[ERROR] Failed: {' '.join(command)}")
            print(result.stderr.strip())
            return None
        return result.stdout
    except Exception as e:
        print("[EXCEPTION]", e)
        return None

def get_usernames():
    output = run_sudo_command(["samba-tool", "user", "list"])
    if not output:
        return []
    return [line.strip() for line in output.strip().splitlines() if line.strip()]

def get_user_info(username: str):
    output = run_sudo_command(["samba-tool", "user", "show", username])
    if not output:
        return None

    info = {}
    for line in output.strip().splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            info[key.strip()] = value.strip()
    return info

def send_to_api(data):
    try:
        response = requests.post(API_ENDPOINT, json={"users": data}, timeout=10)
        if response.status_code == 200:
            print("[INFO] Sent to API.")
        else:
            print(f"[ERROR] API {response.status_code}: {response.text}")
    except Exception as e:
        print("[ERROR] Sending to API:", e)

def main():
    usernames = get_usernames()
    if not usernames:
        print("[INFO] No users found.")
        return

    results = []
    for username in usernames:
        info = get_user_info(username)
        if info:
            results.append(info)

    if results:
        send_to_api(results)

if __name__ == "__main__":
    main()
