import { createSSEStream } from "@/lib/sse"
import { NextRequest } from "next/server"

let clients: any[] = []

export async function GET(req: NextRequest) {
  const { readable, push } = createSSEStream()

  // Add this client to listeners
  clients.push(push)

  req.signal.addEventListener("abort", () => {
    clients = clients.filter(c => c !== push)
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// Notify all connected clients
export function broadcastChange(data: any) {
  clients.forEach((push) => push(JSON.stringify(data)))
}
export async function POST(req: NextRequest) {
    const data = await req.json()
    broadcastChange(data)
    return new Response("OK")
  }
  