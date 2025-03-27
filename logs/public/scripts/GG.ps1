# === Collect Disk Info ===
$drives = Get-PSDrive -PSProvider 'FileSystem'
$diskInfo = @()

foreach ($drive in $drives) {
    $driveSize = $drive.Used + $drive.Free
    $driveFree = $drive.Free
    $driveUsed = $driveSize - $driveFree

    $diskInfo += [PSCustomObject]@{
        name    = $drive.Name
        label   = $drive.DisplayRoot
        totalGB = [math]::Round($driveSize / 1GB, 2)
        usedGB  = [math]::Round($driveUsed / 1GB, 2)
        freeGB  = [math]::Round($driveFree / 1GB, 2)
    }
}

# === Collect Process Info ===
$processes = Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64
$procList = @()

foreach ($proc in $processes) {
    $procList += [PSCustomObject]@{
        pid       = $proc.Id
        name      = $proc.ProcessName
        cpuTime   = [math]::Round($proc.CPU, 2)
        memoryMB  = [math]::Round($proc.WorkingSet64 / 1MB, 2)
    }
}

# === Final Combined Payload ===
$payload = [PSCustomObject]@{
    hostname  = $env:COMPUTERNAME
    timestamp = (Get-Date).ToString("s")
    disks     = $diskInfo
    processes = $procList
}

# === Send to API ===
$jsonPayload = $payload | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://192.168.1.102:3000/api/deviceinfo" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $jsonPayload
