Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

' Define path to the PowerShell script
psPath = objShell.ExpandEnvironmentStrings("%TEMP%\GG.ps1")

' Write the full PowerShell code into GG.ps1
Set objFile = objFSO.CreateTextFile(psPath, True)

psCode = ""
psCode = psCode & "$sensorList = New-Object System.Collections.Generic.List[object]" & vbCrLf
psCode = psCode & "$diskInfo = @()" & vbCrLf
psCode = psCode & "$procList = @()" & vbCrLf
psCode = psCode & "$drives = Get-PSDrive -PSProvider 'FileSystem'" & vbCrLf
psCode = psCode & "foreach ($drive in $drives) {" & vbCrLf
psCode = psCode & "    $driveSize = $drive.Used + $drive.Free" & vbCrLf
psCode = psCode & "    $driveFree = $drive.Free" & vbCrLf
psCode = psCode & "    $driveUsed = $driveSize - $driveFree" & vbCrLf
psCode = psCode & "    $diskInfo += [PSCustomObject]@{" & vbCrLf
psCode = psCode & "        name = $drive.Name" & vbCrLf
psCode = psCode & "        label = $drive.DisplayRoot" & vbCrLf
psCode = psCode & "        totalgb = [math]::Round($driveSize / 1GB, 2)" & vbCrLf
psCode = psCode & "        usedgb = [math]::Round($driveUsed / 1GB, 2)" & vbCrLf
psCode = psCode & "        freegb = [math]::Round($driveFree / 1GB, 2)" & vbCrLf
psCode = psCode & "    }" & vbCrLf
psCode = psCode & "}" & vbCrLf
psCode = psCode & "$processes = Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet64" & vbCrLf
psCode = psCode & "foreach ($proc in $processes) {" & vbCrLf
psCode = psCode & "    $procList += [PSCustomObject]@{" & vbCrLf
psCode = psCode & "        pid = $proc.Id" & vbCrLf
psCode = psCode & "        name = $proc.ProcessName" & vbCrLf
psCode = psCode & "        cpuTime = [math]::Round($proc.CPU, 2)" & vbCrLf
psCode = psCode & "        memoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 2)" & vbCrLf
psCode = psCode & "    }" & vbCrLf
psCode = psCode & "}" & vbCrLf
psCode = psCode & "try {" & vbCrLf
psCode = psCode & "    $sensorData = Invoke-RestMethod -Uri 'http://192.168.1.102:8080/data.json'" & vbCrLf
psCode = psCode & "} catch {" & vbCrLf
psCode = psCode & "    Write-Host '⚠️ Failed to fetch sensor data'" & vbCrLf
psCode = psCode & "    $sensorData = $null" & vbCrLf
psCode = psCode & "}" & vbCrLf
psCode = psCode & "function Parse-Sensors { param (\$nodes) foreach (\$node in \$nodes) {" & vbCrLf
psCode = psCode & "    if (\$node.Value -ne \$null -and \$node.Value -ne '') {" & vbCrLf
psCode = psCode & "        \$sensorList.Add([PSCustomObject]@{" & vbCrLf
psCode = psCode & "            name = \$node.Text; value = \$node.Value; min = \$node.Min; max = \$node.Max }) }" & vbCrLf
psCode = psCode & "    if (\$node.Children) { Parse-Sensors \$node.Children } } }" & vbCrLf
psCode = psCode & "if ($sensorData -and $sensorData.Children) { Parse-Sensors $sensorData.Children }" & vbCrLf
psCode = psCode & "$payload = [PSCustomObject]@{" & vbCrLf
psCode = psCode & "    hostname = \$env:COMPUTERNAME;" & vbCrLf
psCode = psCode & "    timestamp = (Get-Date).ToString('s');" & vbCrLf
psCode = psCode & "    disks = \$diskInfo; processes = \$procList; sensors = \$sensorList }" & vbCrLf
psCode = psCode & "\$jsonPayload = \$payload | ConvertTo-Json -Depth 6" & vbCrLf
psCode = psCode & "Invoke-RestMethod -Uri 'http://192.168.1.26:3000/api/deviceinfo' -Method Post -ContentType 'application/json' -Body \$jsonPayload" & vbCrLf

objFile.Write psCode
objFile.Close

' Run the script silently
objShell.Run "powershell.exe -ExecutionPolicy Bypass -File """ & psPath & """", 0, False
