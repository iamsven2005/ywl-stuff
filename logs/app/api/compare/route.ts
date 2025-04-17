import { NextRequest, NextResponse } from "next/server"
import { db2 } from "@/lib/db"

function serializeBigInts(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts)
  } else if (obj && typeof obj === "object") {
    const result: any = {}
    for (const key in obj) {
      const value = obj[key]
      result[key] =
        typeof value === "bigint" ? value.toString() : serializeBigInts(value)
    }
    return result
  }
  return obj
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { embedding } = body

  if (!embedding || !Array.isArray(embedding)) {
    return NextResponse.json({ error: "Invalid embedding vector" }, { status: 400 })
  }

  console.log("Received embedding vector:", embedding.slice(0, 5), "...")

  const results = await db2.$queryRawUnsafe(
    `
    SELECT id, name, 1 - (embedding <#> $1::vector) AS score
    FROM items
    WHERE name IS NOT NULL
    ORDER BY score DESC
    LIMIT 10;
    `,
    embedding
  )
  

  const serialized = serializeBigInts(results)
  return NextResponse.json({ results: serialized })
}
