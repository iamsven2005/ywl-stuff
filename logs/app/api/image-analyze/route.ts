import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get("image") as File;

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
  return Response.json(data);
}
