import { NextResponse } from "next/server"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

// Database connection details
const DATABASE_URL = "postgresql://admin@192.168.1.26:5432/logs_database"
const BACKUP_FOLDER = "/mnt/nas/sven.tan/MyDocs" // NAS location
const FALLBACK_FOLDER = path.join(os.tmpdir(), "database_backups") // Fallback

export async function POST() {
  try {
    // Ensure backup folder exists
    if (!fs.existsSync(BACKUP_FOLDER)) {
      console.warn("NAS backup folder not found. Using fallback:", FALLBACK_FOLDER)
      if (!fs.existsSync(FALLBACK_FOLDER)) fs.mkdirSync(FALLBACK_FOLDER, { recursive: true })
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `backup-${timestamp}.sql`
    const filePath = fs.existsSync(BACKUP_FOLDER)
      ? path.join(BACKUP_FOLDER, fileName)
      : path.join(FALLBACK_FOLDER, fileName)

    // Construct pg_dump command with .pgpass for authentication
    const dumpCommand = `PGPASSFILE=~/.pgpass pg_dump -h 192.168.1.26 -U admin -d logs_database -F c -b -v -f "${filePath}"`

    // Execute backup command
    return new Promise((resolve, reject) => {
      exec(dumpCommand, (error, stdout, stderr) => {
        if (error) {
          console.error("Backup error:", stderr)
          reject(NextResponse.json({ success: false, message: "Backup failed" }, { status: 500 }))
        } else {
          console.log("Backup successful:", stdout)
          resolve(NextResponse.json({ success: true, filePath }))
        }
      })
    })
  } catch (error) {
    console.error("Backup process failed:", error)
    return NextResponse.json({ success: false, message: "Backup failed" }, { status: 500 })
  }
}
