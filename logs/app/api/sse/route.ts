import { subscribe } from "@/app/forms/broadcast"
import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const channel = searchParams.get("channel")

  if (!channel) {
    return new Response("Channel parameter is required", { status: 400 })
  }

  // Create a new ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

      // Subscribe to the channel
      const unsubscribe = subscribe(channel, (data) => {
        // Send the data as an SSE event
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      })

      // Handle connection close
      request.signal.addEventListener("abort", () => {
        unsubscribe()
      })
    },
  })

  // Return the stream as a response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
