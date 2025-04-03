// app/components/TextBoxCopyStepper.tsx
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"

export default function TextBoxCopyStepper() {
  const baseUrl = "http://192.168.1.71:8000/wci1/menu?id="
  const [currentId, setCurrentId] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCopy = async () => {
    const url = `${baseUrl}${currentId}`
  
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setCurrentId((prev) => prev + 1)
        return
      } catch (err) {
        console.error("Clipboard writeText failed:", err)
      }
    }
  
    // Fallback: select input text so user can copy manually
    if (inputRef.current) {
      inputRef.current.select()
      document.execCommand("copy")
      setCurrentId((prev) => prev + 1)
    }
  }
  

  const handleReset = () => {
    setCurrentId(492)
  }

  return (
    <div className="space-y-2 max-w-md">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={`${baseUrl}${currentId}`}
          readOnly
          className="flex-1 font-mono"
        />
        <Button onClick={handleCopy} title="Copy and go to next ID">
          <Copy className="w-4 h-4 mr-1" />
          Copy
        </Button>
      </div>
      <div>
        <Button variant="outline" onClick={handleReset}>
          Reset to ID 1
        </Button>
      </div>
    </div>
  )
}
