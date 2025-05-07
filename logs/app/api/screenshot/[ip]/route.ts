import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest, { params }: { params: { ip: string } }) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const filePath = path.join(process.cwd(), "public", "uploads", `${params.ip}.png`)
  await writeFile(filePath, buffer)

  return NextResponse.json({ success: true })  
}

