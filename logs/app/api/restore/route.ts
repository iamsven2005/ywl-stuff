import { NextResponse } from "next/server"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

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

function getLatestSQLFile(folder: string, prefix: string): string | null {
  if (!fs.existsSync(folder)) return null

  const files = fs.readdirSync(folder)
    .filter(file => file.startsWith(prefix) && file.endsWith(".sql"))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(folder, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time)

  return files.length > 0 ? path.join(folder, files[0].name) : null
}

export async function POST() {
  try {
    const backupDir = fs.existsSync(BACKUP_FOLDER) ? BACKUP_FOLDER : FALLBACK_FOLDER

    const mainBackup = getLatestSQLFile(backupDir, "backup_main")
    const pgvectorBackup = getLatestSQLFile(backupDir, "backup_pgvector")

    if (!mainBackup || !pgvectorBackup) {
      return NextResponse.json({ success: false, message: "No suitable backup files found" }, { status: 404 })
    }

    const targets = [
      { host: "192.168.1.26", port: "5432", backupFile: mainBackup },
      { host: "192.168.1.26", port: "5433", backupFile: pgvectorBackup },
    ]

    for (const target of targets) {
      const dropSchema = `psql -h ${target.host} -p ${target.port} -U admin -d logs_database -c 'DROP SCHEMA IF EXISTS logs CASCADE;'`
      const restoreCommand = `PGPASSFILE=~/.pgpass psql -h ${target.host} -p ${target.port} -U admin -d logs_database -f "${target.backupFile}"`

      console.log(`Dropping schema on port ${target.port}...`)
      await runCommand(dropSchema)

      console.log(`Restoring backup from ${target.backupFile} on port ${target.port}...`)
      await runCommand(restoreCommand)
    }

    return NextResponse.json({ success: true, mainBackup, pgvectorBackup })
  } catch (error) {
    console.error("Restore process failed:", error)
    return NextResponse.json({ success: false, message: "Restore process crashed", error }, { status: 500 })
  }
}
