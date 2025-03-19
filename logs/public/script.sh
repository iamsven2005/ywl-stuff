#!/bin/bash

# File to store sudo password securely
SUDO_PASS_FILE="$HOME/.sudo_pass"
CONFIG_FILE="$HOME/.script_config"
echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_instances
echo 1048576 | sudo tee /proc/sys/fs/inotify/max_user_watches
echo "CONFIG FILE"
echo $CONFIG_FILE
# Define PostgreSQL Connection Details
DB_NAME="logs_database"
DB_USER="admin"
DB_PASSWORD="host-machine"
DB_HOST="192.168.1.26"
DB_PORT="5432"

get_or_set_hostname() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
    else
        SYSTEM_HOSTNAME=$(hostname)
        echo "HOSTNAME=\"$SYSTEM_HOSTNAME\"" > "$CONFIG_FILE"
    fi
}
echo "HOSTNAME"
echo $HOSTNAME
# Function to prompt for sudo password and store it securely
get_sudo_password() {
    if [[ ! -f "$SUDO_PASS_FILE" ]]; then
        echo "Enter your sudo password (it will be stored securely):"
        read -s SUDO_PASSWORD
        echo "$SUDO_PASSWORD" | openssl enc -aes-256-cbc -salt -pbkdf2 -out "$SUDO_PASS_FILE" -pass pass:"$(whoami)"
        chmod 600 "$SUDO_PASS_FILE"
        echo "Sudo password stored securely."
    fi
}

# Function to retrieve stored sudo password
get_sudo_password_value() {
    if [[ -f "$SUDO_PASS_FILE" ]]; then
        openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$SUDO_PASS_FILE" -pass pass:"$(whoami)"
    else
        echo "❌ Sudo password file not found! Re-run the script."
        exit 1
    fi
}

# Function to run commands with sudo
run_sudo() {
    local CMD=$1
    local SUDO_PASSWORD
    SUDO_PASSWORD=$(get_sudo_password_value)

    if [[ -z "$SUDO_PASSWORD" ]]; then
        echo "❌ Error: Sudo password is missing!"
        exit 1
    fi

    # Execute sudo command with stored password
    echo "$SUDO_PASSWORD" | sudo -S bash -c "$CMD"
}

# 🔥 Step 1: Secure sudo access
get_sudo_password
get_or_set_hostname  
# 🔥 Step 2: Terminate any running `apt` processes
terminate_apt_processes() {
    echo "🔎 Checking for running apt/dpkg processes..."
    local apt_pids=$(pgrep -f "apt|dpkg")

    if [[ -n "$apt_pids" ]]; then
        echo "⚠️ Found running apt/dpkg processes: $apt_pids"
        echo "🛑 Attempting to stop processes gracefully..."
        sudo kill -15 $apt_pids
        sleep 5  # Allow time to exit

        local remaining_pids=$(pgrep -f "apt|dpkg")
        if [[ -n "$remaining_pids" ]]; then
            echo "❌ Processes still running. Forcing termination..."
            sudo kill -9 $remaining_pids
        fi
        echo "✅ All blocking apt/dpkg processes have been terminated."
    else
        echo "✅ No blocking apt processes found."
    fi
}

terminate_apt_processes

# 🔄 Step 3: Update and install packages
run_sudo "apt update -y"
run_sudo "apt install -y lm-sensors python3-psutil postgresql postgresql-contrib inotify-tools curl"

# Ensure PostgreSQL is running
run_sudo "systemctl enable postgresql"
run_sudo "systemctl start postgresql"

# Initialize lm-sensors
echo "Initializing lm-sensors..."
run_sudo "sensors-detect --auto"

# Verify installations
echo "Checking installed packages..."
dpkg -l | grep -E "lm-sensors|postgresql|python3-psutil|inotify-tools"

echo "✅ All necessary packages installed successfully!"

# Increase inotify limits
echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_instances
echo 1048576 | sudo tee /proc/sys/fs/inotify/max_user_watches

# --- ✅ Adding Back `.bash_profile` Section ---
BASH_PROFILE="$HOME/.bash_profile"
BASH_COMMAND="psql \"postgresql://admin:host-machine@192.168.1.26:5432/logs_database\" -c \"INSERT INTO logs.logs (name,host) VALUES ('login', '$HOSTNAME')\""

# Check if ~/.bash_profile exists, if not create it
if [ ! -f "$BASH_PROFILE" ]; then
    touch "$BASH_PROFILE"
    echo "~/.bash_profile created."
fi

# Append command only if it does not already exist
if ! grep -Fxq "$BASH_COMMAND" "$BASH_PROFILE"; then
    echo "$BASH_COMMAND" >> "$BASH_PROFILE"
    echo "✅ Command added to ~/.bash_profile."
else
    echo "⚠️ Command already exists in ~/.bash_profile. Skipping."
fi

# Source ~/.bash_profile to apply changes immediately
source "$BASH_PROFILE"
GDM_POSTSESSION="/etc/gdm3/PostSession/Default"

update_gdm_postsession() {
    echo "🔎 Checking for $GDM_POSTSESSION..."

    # Check if the file exists
    if [[ -f "$GDM_POSTSESSION" ]]; then
        echo "✅ Found $GDM_POSTSESSION. Updating its content..."

        # Backup the existing file before modification
        run_sudo "cp \"$GDM_POSTSESSION\" \"$GDM_POSTSESSION.bak\""

        # Replace the content of the file
        run_sudo "echo -e '#!/bin/sh\npsql \"postgresql://admin:host-machine@192.168.1.26:5432/logs_database\" -c \"INSERT INTO logs.logs (name, host) VALUES (\"logout\", \"$HOSTNAME\")\"\nexit 0' > \"$GDM_POSTSESSION\""

        # Ensure the file has executable permissions
        run_sudo "chmod +x \"$GDM_POSTSESSION\""

        echo "✅ Successfully updated $GDM_POSTSESSION with logout logging."
    else
        echo "⚠️ $GDM_POSTSESSION not found. GDM might not be installed or using a different path."
    fi
}

# Run the function to update the GDM logout script with admin privileges
update_gdm_postsession
# Increase inotify limits

# File paths
PREV_PROCESSES="/tmp/prev_processes.txt"
LOG_FILE="/tmp/script_cron.log"
INSTALL_PATH="$HOME/Desktop/script.sh"
TMP_PATH="/tmp/install_new.sh"
SCRIPT_URL="http://192.168.1.102:3000/script.sh"
CRON_JOB="*/10 * * * * /bin/bash $INSTALL_PATH >> $LOG_FILE 2>&1"

# --- 1. Define Log Insertion Function Globally ---
insert_log_entry() {
    local log_entry="$1"

    # Remove the date and time portion from the log entry (covers multiple formats)
    log_entry_cleaned=$(echo "$log_entry" | sed 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}[T ]*[0-9]*:[0-9]*:[0-9]*:[0-9]*[+-][0-9]*//')

    # Escape special characters for safe SQL insertion
    log_entry_escaped=$(echo "$log_entry_cleaned" | sed "s/'/''/g")

    # Formulate the SQL query
    local query="INSERT INTO logs.auth (log_entry, username) VALUES ('$log_entry_escaped', '$HOSTNAME');"

    # Hardcoded credentials
    PGPASSWORD="host-machine" psql -U "admin" -h "192.168.1.26" -p "5432" -d "logs_database" -c "$query" 2>&1

    # Capture the exit status
    if [[ $? -eq 0 ]]; then
        echo "[SUCCESS] Log Saved: $log_entry_cleaned"
    else
        echo "[ERROR] Failed to log entry."
    fi
}



# Export function so it's available in subshells
export -f insert_log_entry

# --- 2. Monitor Authentication Logs ---
monitor_auth_log() {
    echo "Starting auth log monitoring..."
    inotifywait -m /var/log/auth.log -e modify |
    while read path action file; do
        tail -n 10 /var/log/auth.log | while read line; do
            bash -c "insert_log_entry \"$line\""
            sleep 5  # Add 5 seconds delay
        done
    done
}


# --- 3. Process Monitoring ---
get_processes() {
    if [[ ! -f "/tmp/current_processes.txt" ]]; then
        touch "/tmp/current_processes.txt"
    fi

    ps aux --no-headers | awk '{print $1, $2, $3, $4, substr($0, index($0, $11))}' > /tmp/current_processes.txt
}

log_process_change() {
    local ACTION=$1
    local PID=$2
    local USER=$3
    local CPU=$4
    local MEM=$5
    local COMMAND=$6

    if [[ "$COMMAND" == *"ps aux --no-headers"* || "$COMMAND" == *"awk"* || "$COMMAND" == *"[kworker"* || "$COMMAND" == *"postgres:"* ]]; then
        return
    fi

    PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c "
    INSERT INTO logs.logs (action, name, pid, piuser, cpu, mem, command, host)
    VALUES ('$ACTION', 'process', $PID, '$USER', $CPU, $MEM, '$COMMAND', '$HOSTNAME');
    "
    echo "[SUCCESS] Logged $ACTION event for PID $PID."
}

check_process_changes() {
    if [[ ! -f "$PREV_PROCESSES" ]]; then
        get_processes
        mv /tmp/current_processes.txt "$PREV_PROCESSES"
    fi

    get_processes

    while read -r LINE; do
        if ! grep -Fxq "$LINE" "$PREV_PROCESSES"; then
            PID=$(echo "$LINE" | awk '{print $2}')
            USER=$(echo "$LINE" | awk '{print $1}')
            CPU=$(echo "$LINE" | awk '{print $3}')
            MEM=$(echo "$LINE" | awk '{print $4}')
            COMMAND=$(echo "$LINE" | cut -d' ' -f5-)

            log_process_change "STARTED" "$PID" "$USER" "$CPU" "$MEM" "$COMMAND"
            sleep 5  # Add 5 seconds delay
        fi
    done < /tmp/current_processes.txt

    mv /tmp/current_processes.txt "$PREV_PROCESSES"
}

log_memory_usage() {
    TOTAL_MEMORY=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    FREE_MEMORY=$(grep MemFree /proc/meminfo | awk '{print $2}')
    AVAILABLE_MEMORY=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    USED_MEMORY=$((TOTAL_MEMORY - FREE_MEMORY))
    PERCENT_USAGE=$(awk "BEGIN {print ($USED_MEMORY/$TOTAL_MEMORY)*100}")

    PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c "
    INSERT INTO logs.memory_usage (total_memory, used_memory, free_memory, available_memory, percent_usage, host)
    VALUES ($TOTAL_MEMORY, $USED_MEMORY, $FREE_MEMORY, $AVAILABLE_MEMORY, $PERCENT_USAGE, '$HOSTNAME');
    "
    sleep 5  # Add 5 seconds delay
}

log_sensor_data() {
    sensors | while IFS= read -r line; do
        if [[ "$line" == *":"* ]]; then
            SENSOR_NAME=$(echo "$line" | cut -d':' -f1 | xargs)
            VALUE_PART=$(echo "$line" | cut -d':' -f2 | xargs)
            VALUE=$(echo "$VALUE_PART" | grep -oE '[-+]?[0-9]*\.?[0-9]+' | head -n1)

            if [[ -z "$VALUE" ]]; then
                continue
            fi

            if [[ "$VALUE_PART" == *"°C"* ]]; then
                VALUE_TYPE="temperature"
            elif [[ "$VALUE_PART" == *"RPM"* ]]; then
                VALUE_TYPE="fan_speed"
            elif [[ "$VALUE_PART" == *"V"* ]]; then
                VALUE_TYPE="voltage"
            elif [[ "$VALUE_PART" == *"W"* ]]; then
                VALUE_TYPE="power"
            else
                VALUE_TYPE="unknown"
            fi

            PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c "
            INSERT INTO logs.system_metrics (sensor_name, value_type, value, host)
            VALUES ('$SENSOR_NAME', '$VALUE_TYPE', $VALUE, '$HOSTNAME');
            "
            sleep 5  # Add 5 seconds delay
        fi
    done
}


# --- 4. Self-Update and Cron Job Setup ---
install_self() {
    if [ "$0" != "$INSTALL_PATH" ]; then
        curl -o "$INSTALL_PATH" "$SCRIPT_URL" || exit 1
        chmod +x "$INSTALL_PATH"

        if ! crontab -l | grep -q "$INSTALL_PATH"; then
            (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        fi


        exec "$INSTALL_PATH"
        exit 0
    fi
}

self_update() {
    curl -fsSL -o "$TMP_PATH" "$SCRIPT_URL" || return
    if [ ! -s "$TMP_PATH" ]; then
        rm -f "$TMP_PATH"
        return
    fi

    if ! cmp -s "$INSTALL_PATH" "$TMP_PATH"; then
        mv "$TMP_PATH" "$INSTALL_PATH"
        chmod +x "$INSTALL_PATH"
        exec "$INSTALL_PATH"
    else
        rm -f "$TMP_PATH"
    fi
}


install_self
self_update

# Run the functions
monitor_auth_log &
check_process_changes &
log_memory_usage &
log_sensor_data &
wait

