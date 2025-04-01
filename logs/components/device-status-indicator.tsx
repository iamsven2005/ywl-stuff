"use client"

import { useDeviceStatus } from "@/app/hooks/use-device-status"
import { Badge } from "@/components/ui/badge"

interface DeviceStatusIndicatorProps {
  deviceId: number
}

export function DeviceStatusIndicator({ deviceId }: DeviceStatusIndicatorProps) {
  const { deviceStatuses, isConnected } = useDeviceStatus()

  const deviceStatus = deviceStatuses[deviceId]

  if (!isConnected) {
    return <Badge variant="outline">Connecting...</Badge>
  }

  if (!deviceStatus) {
    return <Badge variant="outline">Unknown</Badge>
  }

  return (
    <Badge
      variant={deviceStatus.status === "online" ? "outline" : "destructive"}
      className={deviceStatus.status === "online" ? "bg-green-500" : "bg-red-500"}
    >
      {deviceStatus.status === "online" ? "Online" : "Offline"}
    </Badge>
  )
}

