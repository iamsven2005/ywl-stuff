import { NextResponse } from "next/server"
import { exec } from "child_process"
import path from "path"
import os from "os"
import fs from "fs"

// Constants
const BACKUP_FOLDER = "/mnt/userdocuments/sven.tan/MyDocs"
const FALLBACK_FOLDER = path.join(os.tmpdir(), "database_backups")

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Command failed:", stderr)
        reject(stderr)
      } else {
        console.log("Command success:", stdout)
        resolve()
      }
    })
  })
}

export async function POST() {
  try {
    const backupDir = fs.existsSync(BACKUP_FOLDER) ? BACKUP_FOLDER : FALLBACK_FOLDER

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const mainBackupPath = path.join(backupDir, `backup_main_${timestamp}.sql`)
    const pgvectorBackupPath = path.join(backupDir, `backup_pgvector_${timestamp}.sql`)

    // Commands
    const backupMain = `PGPASSFILE=~/.pgpass pg_dump -h 192.168.1.26 -p 5432 -U admin -d logs_database -f "${mainBackupPath}"`
    const backupPgvector = `PGPASSFILE=~/.pgpass pg_dump -h 192.168.1.26 -p 5433 -U admin -d logs_database -f "${pgvectorBackupPath}"`

    console.log("Backing up main DB...")
    await runCommand(backupMain)

    console.log("Backing up pgvector DB...")
    await runCommand(backupPgvector)

    return NextResponse.json({ success: true, mainBackup: mainBackupPath, pgvectorBackup: pgvectorBackupPath })
  } catch (error) {
    console.error("Backup process failed:", error)
    return NextResponse.json({ success: false, message: "Backup process crashed", error }, { status: 500 })
  }
}
