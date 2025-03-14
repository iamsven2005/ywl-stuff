import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Backup storage location
const BACKUP_FOLDER = "/mnt/nas/sven.tan/MyDocs"; // Ensure path exists
const DATABASE_NAME = "logs_database";
const DATABASE_HOST = "192.168.1.26";
const DATABASE_USER = "admin"; // Use only username
const PGPASSFILE = "/home/sven/.pgpass";

export async function POST() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_FOLDER)) {
      return NextResponse.json({ success: false, message: "Backup folder not found" }, { status: 500 });
    }

    // Get the latest backup file
    const files = fs.readdirSync(BACKUP_FOLDER)
      .filter(file => file.endsWith(".dump")) // Use correct extension
      .sort((a, b) => fs.statSync(path.join(BACKUP_FOLDER, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_FOLDER, a)).mtime.getTime());

    if (files.length === 0) {
      return NextResponse.json({ success: false, message: "No backup files found" }, { status: 500 });
    }

    const latestBackup = files[0];
    const filePath = path.join(BACKUP_FOLDER, latestBackup);

    // Pre-Restore: Drop and recreate schema
    const dropSchemaCommand = `PGPASSFILE=${PGPASSFILE} psql -h ${DATABASE_HOST} -U ${DATABASE_USER} -d ${DATABASE_NAME} -c "DROP SCHEMA IF EXISTS logs CASCADE; CREATE SCHEMA logs;"`;

    // Restore Command (drops tables, constraints before restoring)
    const restoreCommand = `PGPASSFILE=${PGPASSFILE} pg_restore --clean --if-exists --no-owner --no-privileges -h ${DATABASE_HOST} -U ${DATABASE_USER} -d ${DATABASE_NAME} -v "${filePath}"`;

    console.log("Executing schema reset:", dropSchemaCommand);
    console.log("Executing restore:", restoreCommand);

    return new Promise((resolve, reject) => {
      // Drop schema first
      exec(dropSchemaCommand, (error, stdout, stderr) => {
        if (error) {
          console.error("Schema reset error:", stderr);
          return reject(NextResponse.json({ success: false, message: `Schema reset failed: ${stderr}` }, { status: 500 }));
        }

        // Now restore the database
        exec(restoreCommand, (restoreError, restoreStdout, restoreStderr) => {
          if (restoreError) {
            console.error("Restore error:", restoreStderr);
            return reject(NextResponse.json({ success: false, message: `Restore failed: ${restoreStderr}` }, { status: 500 }));
          }

          console.log("Restore successful:", restoreStdout);
          resolve(NextResponse.json({ success: true, message: "Database restored successfully", latestBackup }));
        });
      });
    });
  } catch (error) {
    console.error("Restore process failed:", error);
    return NextResponse.json({ success: false, message: "Restore process failed" }, { status: 500 });
  }
}
