#!/bin/bash

# === CONFIG ===
INSTALL_DIR="/c/LibreHardwareMonitor"
WIN_INSTALL_DIR="C:\\LibreHardwareMonitor"
ZIP_URL="https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases/latest/download/LibreHardwareMonitor.zip"
ZIP_FILE="$INSTALL_DIR/LibreHardwareMonitor.zip"
EXE_NAME="LibreHardwareMonitor.exe"
LOG_FILE="C:\\system_event_log.txt"
LOG_SCRIPT="C:\\log_system_event.ps1"
TEMP_LOG_SCRIPT="C:\\LibreHardwareMonitor\\log_temp.ps1"
PG_PUSH_SCRIPT="C:\\push_logs_to_pg.ps1"

PG_HOST="192.168.1.26"
PG_PORT="5432"
PG_USER="admin"
PG_PASS="host-machine"
PG_DB="logs_database"

# === 1. Create Install Directory ===
echo "[+] Creating install directory..."
mkdir -p "$INSTALL_DIR"

# === 2. Download & Extract LibreHardwareMonitor ===
echo "[+] Downloading LibreHardwareMonitor..."
curl -L -o "$ZIP_FILE" "$ZIP_URL"

echo "[+] Extracting LibreHardwareMonitor..."
powershell.exe -Command "
Expand-Archive -LiteralPath '$ZIP_FILE' -DestinationPath '$WIN_INSTALL_DIR' -Force
"

rm "$ZIP_FILE"

# === 3. Create Event Logger Script ===
echo "[+] Creating system event logging script..."
cat << EOF | powershell.exe -Command -
@'
\$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
\$event = \$env:SYSTEM_EVENT_TYPE

if (\$env:RAW_EVENT_XML) {
    try {
        \$xml = [xml]\$env:RAW_EVENT_XML
        \$procName = \$xml.Event.EventData.Data | Where-Object { \$_.Name -eq "NewProcessName" } | Select-Object -ExpandProperty "#text"
        \$user = \$xml.Event.EventData.Data | Where-Object { \$_.Name -eq "SubjectUserName" } | Select-Object -ExpandProperty "#text"
        Add-Content -Path "$LOG_FILE" -Value "\$timestamp - New Process Started - \$procName by \$user"
    } catch {
        Add-Content -Path "$LOG_FILE" -Value "\$timestamp - \$event (Event parse error)"
    }
} else {
    Add-Content -Path "$LOG_FILE" -Value "\$timestamp - \$event"
}
'@ | Set-Content -Path "$LOG_SCRIPT"
EOF

# === 4. Create CPU Temp Logging Script ===
echo "[+] Creating temperature logging script..."
cat << EOF | powershell.exe -Command -
@'
Add-Type -Path "$WIN_INSTALL_DIR\\LibreHardwareMonitorLib.dll"
\$computer = New-Object LibreHardwareMonitor.Hardware.Computer
\$computer.IsCpuEnabled = \$true
\$computer.Open()
\$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
\$data = @()
foreach (\$hardware in \$computer.Hardware) {
    if (\$hardware.HardwareType -eq 'Cpu') {
        \$hardware.Update()
        foreach (\$sensor in \$hardware.Sensors) {
            if (\$sensor.SensorType -eq 'Temperature') {
                \$data += "\$timestamp, \$($sensor.Name), \$($sensor.Value)°C"
            }
        }
    }
}
\$data | Out-File -Append -FilePath "$WIN_INSTALL_DIR\\sensor_log.csv"
'@ | Set-Content -Path "$TEMP_LOG_SCRIPT"
EOF

# === 5. Create PostgreSQL Log Push Script ===
echo "[+] Creating PostgreSQL log push script..."
cat << EOF | powershell.exe -Command -
@'
Add-Type -AssemblyName System.Data
Add-Type -Path "$($env:USERPROFILE)\\.nuget\\packages\\npgsql\\*\\lib\\netstandard2.0\\Npgsql.dll"

\$connectionString = "Host=$PG_HOST;Port=$PG_PORT;Username=$PG_USER;Password=$PG_PASS;Database=$PG_DB"
\$logFile = "$LOG_FILE"
\$stateFile = "C:\\last_log_line.txt"

if (Test-Path \$stateFile) {
    \$lastLine = [int](Get-Content \$stateFile)
} else {
    \$lastLine = 0
}

\$lines = Get-Content \$logFile
\$newLines = \$lines[\$lastLine..(\$lines.Length - 1)]

\$conn = New-Object Npgsql.NpgsqlConnection(\$connectionString)
\$conn.Open()

foreach (\$line in \$newLines) {
    if (\$line -match "^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (.*)$") {
        \$ts = \$matches[1]
        \$msg = \$matches[2]

        \$cmd = \$conn.CreateCommand()
        \$cmd.CommandText = "INSERT INTO system_logs (timestamp, message) VALUES (@ts, @msg)"
        \$cmd.Parameters.Add((New-Object Npgsql.NpgsqlParameter("@ts", [datetime]\$ts))) | Out-Null
        \$cmd.Parameters.Add((New-Object Npgsql.NpgsqlParameter("@msg", \$msg))) | Out-Null
        \$cmd.ExecuteNonQuery()
    }
}

\$conn.Close()
\$lines.Length | Out-File -Encoding ascii -FilePath \$stateFile
'@ | Set-Content -Path "$PG_PUSH_SCRIPT"
EOF

# === 6. Register Scheduled Tasks ===
echo "[+] Registering all scheduled tasks..."

# Run LibreHardwareMonitor at Boot
powershell.exe -Command "
Register-ScheduledTask -TaskName 'StartLibreHardwareMonitor' `
  -Trigger (New-ScheduledTaskTrigger -AtStartup) `
  -Action (New-ScheduledTaskAction -Execute '$WIN_INSTALL_DIR\\\\$EXE_NAME') `
  -RunLevel Highest `
  -User 'SYSTEM' -Force
"

# Log CPU Temp Every 5 Minutes
powershell.exe -Command "
Register-ScheduledTask -TaskName 'LogTempEvery5Min' `
  -Trigger (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)) `
  -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -File $TEMP_LOG_SCRIPT') `
  -RunLevel Highest `
  -User 'SYSTEM' -Force
"

# Log Events (Login, Logoff, Sleep, Shutdown, New Process)
declare -A EVENT_IDS=( ["LogUserLogin"]="4624" ["LogLogoff"]="4634" ["LogSleep"]="42" ["LogShutdown"]="1074" ["LogNewProcess"]="4688" )

for EVENT_NAME in "${!EVENT_IDS[@]}"; do
    powershell.exe -Command "
    \$filter = '<QueryList><Query Id=\"0\" Path=\"System\"><Select Path=\"System\">*[System[EventID=${EVENT_IDS[$EVENT_NAME]}]]</Select></Query></QueryList>'
    Register-ScheduledTask -TaskName '$EVENT_NAME' `
      -Trigger (New-ScheduledTaskTrigger -Subscription \$filter) `
      -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -Command \"\$env:SYSTEM_EVENT_TYPE = \\\"${EVENT_NAME//Log/}\\\"; & $LOG_SCRIPT\"') `
      -RunLevel Highest `
      -User 'SYSTEM' -Force
    "
done

# Push logs to PostgreSQL every 5 minutes
powershell.exe -Command "
Register-ScheduledTask -TaskName 'PushLogsToPG' `
  -Trigger (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)) `
  -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -File $PG_PUSH_SCRIPT') `
  -RunLevel Highest `
  -User 'SYSTEM' -Force
"

echo "[✓] Everything is set up! Logs are stored locally and pushed to PostgreSQL at $PG_HOST:$PG_PORT"
