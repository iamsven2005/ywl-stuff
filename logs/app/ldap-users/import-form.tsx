"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

export default function LdapImportForm() {
  const [ldapData, setLdapData] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ldapData.trim()) {
      setMessage({ type: "error", text: "Please enter LDAP data" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/ldap-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ldapData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: "success", text: "LDAP user imported successfully" })
        setLdapData("")
        router.refresh()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to import LDAP user" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while importing LDAP user" })
      console.error("Error importing LDAP user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ldapData" className="block text-sm font-medium mb-1">
          LDAP User Data
        </label>
        <Textarea
          id="ldapData"
          value={ldapData}
          onChange={(e) => setLdapData(e.target.value)}
          placeholder="Paste LDAP user data here..."
          rows={10}
          className="font-mono text-sm"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Importing..." : "Import LDAP User"}
      </Button>
    </form>
  )
}

