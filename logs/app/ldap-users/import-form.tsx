"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LdapImportForm() {
  const [ldapData, setLdapData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ldapData.trim()) {
      setError("Please enter LDAP data")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log("Sending LDAP data:", { ldapData })

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ldapData }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setLdapData("")
        router.refresh()
      } else {
        setError(result.error || "Failed to import LDAP data")
      }
    } catch (err) {
      setError("An error occurred while importing LDAP data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>LDAP user imported successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="ldapData" className="text-sm font-medium">
          LDAP User Data
        </label>
        <Textarea
          id="ldapData"
          value={ldapData}
          onChange={(e) => setLdapData(e.target.value)}
          placeholder="Paste LDAP user data here..."
          rows={15}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">Paste the raw LDAP user data in attribute: value format.</p>
      </div>

      <Button type="submit" disabled={isLoading || !ldapData.trim()}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Importing..." : "Import LDAP User"}
      </Button>
    </form>
  )
}

