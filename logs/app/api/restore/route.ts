import { NextResponse } from "next/server"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

// Constants
const DATABASE_URL = "postgresql://admin:host-machine@192.168.1.26:5432/logs_database"
const BACKUP_FOLDER = "/mnt/userdocuments/sven.tan/MyDocs"
const FALLBACK_FOLDER = path.join(os.tmpdir(), "database_backups")

function getLatestSQLFile(folder: string): string | null {
  if (!fs.existsSync(folder)) return null

  const files = fs.readdirSync(folder)
    .filter(file => file.endsWith(".sql"))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(folder, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time)

  return files.length > 0 ? path.join(folder, files[0].name) : null
}

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
    const latestBackup = getLatestSQLFile(backupDir)

    if (!latestBackup) {
      return NextResponse.json({ success: false, message: "No .sql backup file found" }, { status: 404 })
    }

    const targets = [
      { host: "192.168.1.26", port: "5432" },
      { host: "192.168.1.26", port: "5433" },
    ]

    for (const target of targets) {
      const dropSchema = `psql -h ${target.host} -p ${target.port} -U admin -d logs_database -c 'DROP SCHEMA IF EXISTS logs CASCADE;'`
      const restoreCommand = `PGPASSFILE=~/.pgpass psql -h ${target.host} -p ${target.port} -U admin -d logs_database -f "${latestBackup}"`

      console.log(`Dropping schema on port ${target.port}...`)
      await runCommand(dropSchema)

      console.log(`Restoring backup on port ${target.port}...`)
      await runCommand(restoreCommand)
    }

    return NextResponse.json({ success: true, fileRestored: latestBackup })
  } catch (error) {
    console.error("Restore process failed:", error)
    return NextResponse.json({ success: false, message: "Restore process crashed", error }, { status: 500 })
  }
}
