"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the AlertMonitor with no SSR
const AlertMonitor = dynamic(() => import("./alert-monitor").then((mod) => mod.AlertMonitor), {
  ssr: false,
  loading: () => null,
})

export function AlertMonitorWrapper() {
  const [mounted, setMounted] = useState(false)

  // Only render on client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <AlertMonitor />
}

