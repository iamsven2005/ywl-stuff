#!/bin/bash

# Define Paths and URLs
DESKTOP="$HOME/Desktop"
PYTHON_FILES=("auth.py" "pid.py" "sensors.py" "scan.py" "auth-log.py")
SCRIPT_URL="http://192.168.1.102:3000/script.sh"
GDM_POSTSESSION="/etc/gdm3/PostSession/Default"
HOST_FILE="$HOME/.hostname_config"
BASH_PROFILE="$HOME/.bash_profile"

# Define Database Credentials
DB_USER="admin"
DB_PASSWORD="host-machine"
DB_HOST="192.168.1.26"
DB_NAME="logs_database"

# 1️⃣ Download Python files to Desktop
for file in "${PYTHON_FILES[@]}"; do
    curl -o "$DESKTOP/$file" "$SCRIPT_URL/$file"
done

# 2️⃣ Store the hostname
if [[ -f "$HOST_FILE" ]]; then
    source "$HOST_FILE"
else
    echo "HOSTNAME=$(hostname)" > "$HOST_FILE"
fi
source "$HOST_FILE"

# 3️⃣ Prompt for sudo password securely
SUDO_PASS_FILE="$HOME/.sudo_pass"
if [[ ! -f "$SUDO_PASS_FILE" ]]; then
    read -s -p "Enter sudo password: " SUDO_PASSWORD
    echo "$SUDO_PASSWORD" | openssl enc -aes-256-cbc -salt -pbkdf2 -out "$SUDO_PASS_FILE" -pass pass:"$(whoami)"
    chmod 600 "$SUDO_PASS_FILE"
fi
SUDO_PASSWORD=$(openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$SUDO_PASS_FILE" -pass pass:"$(whoami)")

# 4️⃣ Modify Python scripts to replace 'host' variable
for file in "${PYTHON_FILES[@]}"; do
    sed -i "s/\"host\"/\"$HOSTNAME\"/g" "$DESKTOP/$file"
done

# 5️⃣ Update GDM post-session script
sudo bash -c "echo -e '#!/bin/sh\npsql \"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME\" -c \"INSERT INTO logs.logs (name, host) VALUES (\"logout\", \"$HOSTNAME\")\"\nexit 0' > \"$GDM_POSTSESSION\""

# 6️⃣ Ensure .bash_profile logs login events
BASH_CMD="psql \"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME\" -c \"INSERT INTO logs.logs (name, host) VALUES ('login', '$HOSTNAME')\""
if [[ ! -f "$BASH_PROFILE" ]]; then
    echo "$BASH_CMD" > "$BASH_PROFILE"
else
    grep -qxF "$BASH_CMD" "$BASH_PROFILE" || echo "$BASH_CMD" >> "$BASH_PROFILE"
fi
source "$BASH_PROFILE"

# 7️⃣ Terminate running apt processes
sudo pkill -f "apt|dpkg" || true

# 8️⃣ Install necessary dependencies
sudo apt update -y && sudo apt install -y lm-sensors python3-psutil postgresql postgresql-contrib inotify-tools curl
sudo systemctl enable postgresql && sudo systemctl start postgresql
sudo sensors-detect --auto

# 9️⃣ Set up crontabs for self-updating & script execution
(crontab -l 2>/dev/null; echo "*/5 * * * * /bin/bash $DESKTOP/script.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/bin/python3 $DESKTOP/scan.py") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/bin/python3 $DESKTOP/sensors.py") | crontab -

# 🔟 Create and restart daemons for pid.py & auth-log.py
cat <<EOF | sudo tee /etc/systemd/system/python_daemon_pid.service
[Unit]
Description=Python Logging Daemon for pid.py
After=network.target

[Service]
ExecStart=/usr/bin/python3 $DESKTOP/pid.py
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF | sudo tee /etc/systemd/system/python_daemon_auth.service
[Unit]
Description=Python Logging Daemon for auth-log.py
After=network.target

[Service]
ExecStart=/usr/bin/python3 $DESKTOP/auth-log.py
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable python_daemon_pid.service
sudo systemctl restart python_daemon_pid.service
sudo systemctl enable python_daemon_auth.service
sudo systemctl restart python_daemon_auth.service

# 🔄 Self-update check
tmp_script="$DESKTOP/tmp_script.sh"
curl -fsSL -o "$tmp_script" "$SCRIPT_URL"
if ! cmp -s "$tmp_script" "$DESKTOP/script.sh"; then
    mv "$tmp_script" "$DESKTOP/script.sh"
    chmod +x "$DESKTOP/script.sh"
    exec "$DESKTOP/script.sh"
fi
