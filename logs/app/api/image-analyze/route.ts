import { db2 } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image") as File;
  const userId = formData.get("userId");
  const filename = formData.get("name")
  if (!image) return new Response("No image provided", { status: 400 });

  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const response = await fetch("http://192.168.1.26:5000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: buffer,
  });

  if (!response.ok) {
    return new Response("Failed to analyze image", { status: 500 });
  }

  const data = await response.json();
  await db2.$executeRaw`
    INSERT INTO "items" (embedding, json, name, fileid, text)
    VALUES (${data.embedding}::vector, ${JSON.stringify(data.embedding)}::jsonb, ${filename}, ${Number(userId)}, ${data.caption})
  `;
  return Response.json(data);
}
