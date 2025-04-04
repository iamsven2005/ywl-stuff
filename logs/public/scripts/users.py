import subprocess
import getpass
import json
import requests

API_ENDPOINT = "http://192.168.1.26:3000/api/users"

def run_sudo_command(command: list, password: str):
    try:
        result = subprocess.run(
            ["sudo", "-S"] + command,
            input=password + "\n",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.returncode != 0:
            print(f"[ERROR] Command failed: {' '.join(command)}")
            print(result.stderr.strip())
            return None
        return result.stdout
    except Exception as e:
        print("[ERROR] Exception during command:", e)
        return None

def get_usernames(password: str):
    output = run_sudo_command(["samba-tool", "user", "list"], password)
    if not output:
        return []
    return [line.strip() for line in output.strip().splitlines() if line.strip()]

def get_user_info(username: str, password: str):
    output = run_sudo_command(["samba-tool", "user", "show", username], password)
    if not output:
        return None

    info = {}
    for line in output.strip().splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            info[key.strip()] = value.strip()
    return info

def send_users_to_api(users):
    try:
        response = requests.post(API_ENDPOINT, json={"users": users}, timeout=10)
        if response.status_code == 200:
            print("[SUCCESS] Data sent successfully.")
        else:
            print(f"[ERROR] API responded with {response.status_code}: {response.text}")
    except Exception as e:
        print("[ERROR] Failed to send data to API:", e)

def main():
    password = getpass.getpass("Enter sudo password: ")
    print("[INFO] Getting user list...")
    usernames = get_usernames(password)

    if not usernames:
        print("[INFO] No Samba users found.")
        return

    all_user_data = []
    for username in usernames:
        print(f"[INFO] Fetching info for user: {username}")
        info = get_user_info(username, password)
        if info:
            all_user_data.append(info)

    print(f"[INFO] Retrieved {len(all_user_data)} users.")
    send_users_to_api(all_user_data)

if __name__ == "__main__":
    main()
