# === Initialize Arrays ===
$sensorList = New-Object System.Collections.Generic.List[object]
$diskInfo = @()
$procList = @()

# === Collect Disk Info ===
$drives = Get-PSDrive -PSProvider 'FileSystem'

foreach ($drive in $drives) {
    $driveSize = $drive.Used + $drive.Free
    $driveFree = $drive.Free
    $driveUsed = $driveSize - $driveFree

    $diskInfo += [PSCustomObject]@{
        name    = $drive.Name
        label   = $drive.DisplayRoot
        totalgb = [math]::Round($driveSize / 1GB, 2)
        usedgb  = [math]::Round($driveUsed / 1GB, 2)
        freegb  = [math]::Round($driveFree / 1GB, 2)
    }
}

# === Collect Process Info ===
$processes = Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64

foreach ($proc in $processes) {
    $procList += [PSCustomObject]@{
        pid       = $proc.Id
        name      = $proc.ProcessName
        cpuTime   = [math]::Round($proc.CPU, 2)
        memoryMB  = [math]::Round($proc.WorkingSet64 / 1MB, 2)
    }
}

# === Collect Sensor Info from LibreHardwareMonitor ===
try {
    $sensorData = Invoke-RestMethod -Uri "http://192.168.1.102:8080/data.json"
} catch {
    Write-Host "⚠️ Failed to fetch sensor data from LibreHardwareMonitor"
    $sensorData = $null
}

function Parse-Sensors {
    param ($nodes)

    foreach ($node in $nodes) {
        if ($node.Value -ne $null -and $node.Value -ne "") {
            $cleaned = [PSCustomObject]@{
                name  = $node.Text
                value = $node.Value
                min   = $node.Min
                max   = $node.Max
            }
            $sensorList.Add($cleaned)
            Write-Host "- $($node.Text): $($node.Value)"
        }

        if ($node.Children) {
            Parse-Sensors $node.Children
        }
    }
}

if ($sensorData -and $sensorData.Children) {
    Write-Host "`n=== SENSOR DATA ==="
    Parse-Sensors $sensorData.Children
}

# === Build Payload ===
$payload = [PSCustomObject]@{
    hostname  = $env:COMPUTERNAME
    timestamp = (Get-Date).ToString("s")
    disks     = $diskInfo
    processes = $procList
    sensors   = $sensorList
}

# === Send to API ===
$jsonPayload = $payload | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri "http://192.168.1.26:3000/api/deviceinfo" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $jsonPayload
