import { type NextRequest, NextResponse } from "next/server"
import { pingDevice } from "@/lib/ping-utils"
import { db } from "@/lib/db"

// Store connected clients
const clients = new Set<{
  id: string
  controller: ReadableStreamDefaultController<string>
}>()


// Store device statuses in memory (not persisted to database)
const deviceStatuses = new Map<number, boolean>()

// Flag to track if the monitoring loop is already running
let isMonitoringRunning = false

// Function to start the monitoring loop
async function startMonitoringLoop() {
  if (isMonitoringRunning) return

  isMonitoringRunning = true

  while (clients.size > 0) {
    try {
      // Fetch all devices from the database
      const devices = await db.devices.findMany({
        select: {
          id: true,
          ip_address: true,
        },
      })

      // Check each device
      for (const device of devices) {
        if (!device.ip_address) continue

        const isOnline = await pingDevice(device.ip_address)
        const previousStatus = deviceStatuses.get(device.id)

        // Only send updates when status changes or on first check
        if (previousStatus === undefined || previousStatus !== isOnline) {
          deviceStatuses.set(device.id, isOnline)

          // Broadcast to all clients
          const update = {
            deviceId: device.id,
            status: isOnline ? "online" : "offline",
            timestamp: new Date().toISOString(),
          }

          for (const client of clients) {
            try {
              client.controller.enqueue(`data: ${JSON.stringify(update)}\n\n`)
            } catch (error) {
              // Client might be disconnected, remove it
              clients.delete(client)
            }
          }
        }
      }

      // Sleep for 30 seconds before the next check
      await new Promise((resolve) => setTimeout(resolve, 30000))
    } catch (error) {
      console.error("Error in monitoring loop:", error)
      // Sleep for 10 seconds before retrying after an error
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }
  }

  isMonitoringRunning = false
}

export async function GET(request: NextRequest) {
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      clients.add({ id: clientId, controller })

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`)

      // Start the monitoring loop if it's not already running
      startMonitoringLoop()
    },
    cancel() {
      for (const client of clients) {
        if (client.id === clientId) {
          clients.delete(client)
          break
        }
      }
    }
    
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

