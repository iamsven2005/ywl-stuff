"use client"

import { useEffect, useState } from "react"

interface SSEOptions {
  onMessage?: (data: any) => void
  onError?: (error: any) => void
  onOpen?: () => void
  enabled?: boolean
}

export function useSSE(channel: string, options: SSEOptions = {}) {
  const { onMessage, onError, onOpen, enabled = true } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  useEffect(() => {
    if (!enabled || !channel || typeof window === "undefined") return

    let sse: EventSource | null = null

    try {
      // Create EventSource
      sse = new EventSource(`/api/sse?channel=${encodeURIComponent(channel)}`)
      setEventSource(sse)

      // Set up event handlers
      sse.onopen = () => {
        setIsConnected(true)
        setError(null)
        onOpen?.()
      }

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastEvent(data)
          onMessage?.(data)
        } catch (err) {
          console.error("Error parsing SSE message:", err)
        }
      }

      sse.onerror = (err) => {
        setIsConnected(false)
        setError(err as any)
        onError?.(err)

        // Close on error
        sse?.close()
      }
    } catch (err) {
      console.error("Error setting up SSE:", err)
      setError(err as any)
    }

    // Clean up
    return () => {
      if (sse) {
        sse.close()
        setEventSource(null)
        setIsConnected(false)
      }
    }
  }, [channel, enabled])

  return {
    isConnected,
    lastEvent,
    error,
    close: () => {
      eventSource?.close()
      setEventSource(null)
      setIsConnected(false)
    },
  }
}
