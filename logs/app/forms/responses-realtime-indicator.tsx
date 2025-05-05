"use client"

import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSSE } from "./use-sse"
import { toast } from "../hooks/use-toast"

interface ResponsesRealTimeIndicatorProps {
  formId: number
}

export function ResponsesRealTimeIndicator({ formId }: ResponsesRealTimeIndicatorProps) {
  const router = useRouter()
  const [newResponses, setNewResponses] = useState(0)

  useSSE(`form-${formId}-responses`, {
    onMessage: (data) => {
      if (data.type === "new-response") {
        setNewResponses((prev) => prev + 1)
        toast({
          title: "New response received",
          description: "Someone has submitted a new response to this form.",
        })
      }
    },
  })

  return (
    <div className="flex items-center gap-2">
      {newResponses > 0 && (
        <Badge
          className="cursor-pointer"
          onClick={() => {
            router.refresh()
            setNewResponses(0)
          }}
        >
          {newResponses} new {newResponses === 1 ? "response" : "responses"}
        </Badge>
      )}
      <Button variant="outline" size="sm" onClick={() => router.refresh()} className="text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        Refresh
      </Button>
    </div>
  )
}
