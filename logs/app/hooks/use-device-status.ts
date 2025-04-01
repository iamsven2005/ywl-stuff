"use client"

import { useState, useEffect } from "react"

type DeviceStatus = {
  deviceId: number
  status: "online" | "offline"
  timestamp: string
}

export function useDeviceStatus() {
  const [deviceStatuses, setDeviceStatuses] = useState<Record<number, DeviceStatus>>({})
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource("/api/device-monitor")

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "connected") {
          console.log("Connected to device monitor:", data.clientId)
        } else if (data.deviceId) {
          setDeviceStatuses((prev) => ({
            ...prev,
            [data.deviceId]: data,
          }))
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error)
      setIsConnected(false)

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close()
      }, 5000)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return { deviceStatuses, isConnected }
}

