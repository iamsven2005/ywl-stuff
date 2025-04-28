#!/bin/bash

echo "Starting cleanup..."

# 1️⃣ Reset GDM PostSession
GDM_POSTSESSION="/etc/gdm3/PostSession/Default"
echo -e "#!/bin/sh\nexit 0" | sudo tee "$GDM_POSTSESSION" > /dev/null
sudo chmod +x "$GDM_POSTSESSION"
echo "✔️ GDM PostSession reset"

# 2️⃣ Remove systemd services
sudo systemctl stop python_daemon_pid.service
sudo systemctl disable python_daemon_pid.service
sudo rm -f /etc/systemd/system/python_daemon_pid.service

sudo systemctl stop python_daemon_auth.service
sudo systemctl disable python_daemon_auth.service
sudo rm -f /etc/systemd/system/python_daemon_auth.service

sudo systemctl daemon-reload
echo "✔️ Systemd services removed"

# 3️⃣ Remove related cron jobs
( crontab -l 2>/dev/null | grep -vE 'script\.sh|scan\.py|sensors\.py|disk\.py' ) | crontab -
echo "✔️ Cron jobs cleaned"

# 4️⃣ Remove downloaded scripts
DESKTOP="$HOME/Desktop"
rm -f "$DESKTOP/pid.py" "$DESKTOP/sensors.py" "$DESKTOP/scan.py" "$DESKTOP/auth-log.py" "$DESKTOP/disk.py" "$DESKTOP/script.sh" "$DESKTOP/tmp_script.sh"
echo "✔️ Downloaded Python and bash files deleted"

# 5️⃣ Remove saved sudo password and hostname config if needed
rm -f "$HOME/.sudo_pass" "$HOME/.hostname_config"
echo "✔️ Password and hostname config cleaned"

# 6️⃣ Remove bash profile additions if you want (optional safer mode)
BASH_PROFILE="$HOME/.bash_profile"
if [[ -f "$BASH_PROFILE" ]]; then
    sed -i '/INSERT INTO logs.logs (name, host)/d' "$BASH_PROFILE"
    echo "✔️ Bash profile cleaned"
fi

echo "✅ Uninstallation complete."
# Self-delete after running
rm -- "$0"
