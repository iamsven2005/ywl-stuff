Set objShell = CreateObject("Wscript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -File ""C:\Users\sven.tan.YWLSG217\Desktop\GG.ps1""", 0, True
objShell.Run "python3 ""C:\Users\sven.tan.YWLSG217\Desktop\windows-sht.py""", 0, False
