// device-status-indicator.tsx
"use client"

import { Badge } from "@/components/ui/badge"

interface DeviceStatusIndicatorProps {
  status?: {
    status: "online" | "offline"
  }
  isConnected: boolean
}

export function DeviceStatusIndicator({ status, isConnected }: DeviceStatusIndicatorProps) {
  if (!isConnected) return <Badge variant="outline">Connecting...</Badge>
  if (!status) return <Badge variant="outline">Unknown</Badge>

  return (
    <Badge
      variant={status.status === "online" ? "outline" : "destructive"}
      className={status.status === "online" ? "bg-green-500" : "bg-red-500"}
    >
      {status.status === "online" ? "Online" : "Offline"}
    </Badge>
  )
}
