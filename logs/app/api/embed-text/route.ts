// /app/api/embed-text/route.ts
import { db, db2 } from "@/lib/db";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, userId, name } = body;

  const res = await fetch("http://192.168.1.26:5000/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text] }),
  });

  if (!res.ok) return new Response("Failed to embed", { status: 500 });

  const result = await res.json();
  await db2.$executeRaw`
  INSERT INTO "items" (embedding, json, name, fileid, text)
  VALUES (${result.embedding}::vector, ${JSON.stringify(result.embedding)}::jsonb, ${name}, ${userId}, ${text})
`;
  return Response.json({ embedding: result.embedding });
}
