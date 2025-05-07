import { writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const name = formData.get("Name")
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const filePath = path.join(process.cwd(), "public", "uploads", "latest.png")
  await writeFile(filePath, buffer)

  return NextResponse.json({ success: true })
}
