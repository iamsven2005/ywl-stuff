// /app/api/embed-text/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  const res = await fetch("http://192.168.1.26:5000/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text] }),
  });

  if (!res.ok) return new Response("Failed to embed", { status: 500 });

  const result = await res.json();
  return Response.json({ embedding: result.embedding });
}
