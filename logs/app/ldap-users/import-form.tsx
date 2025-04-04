"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function LdapImportForm() {
  const [ldapData, setLdapData] = useState("")
  const [batchMode, setBatchMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; details?: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ldapData.trim()) {
      setError("Please enter LDAP data")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ldapData,
          batchMode,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (batchMode) {
          setSuccess({
            message: `Successfully imported ${result.imported} LDAP users`,
            details: result.failed > 0 ? `Failed to import ${result.failed} users` : undefined,
          })
        } else {
          setSuccess({
            message: "LDAP user imported successfully",
          })
        }
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
          <AlertDescription>
            {success.message}
            {success.details && <div className="mt-1 text-sm text-green-700">{success.details}</div>}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2">
        <Switch id="batch-mode" checked={batchMode} onCheckedChange={setBatchMode} />
        <Label htmlFor="batch-mode" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Batch Import Mode
        </Label>
      </div>

      <div className="space-y-2">
        <label htmlFor="ldapData" className="text-sm font-medium">
          {batchMode ? "LDAP Users Data (Multiple Entries)" : "LDAP User Data"}
        </label>
        <Textarea
          id="ldapData"
          value={ldapData}
          onChange={(e) => setLdapData(e.target.value)}
          placeholder={batchMode ? "Paste multiple LDAP user entries here..." : "Paste LDAP user data here..."}
          rows={15}
          required
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          {batchMode
            ? "Paste multiple LDAP user entries. Each entry should start with 'dn:' or 'distinguishedName:'"
            : "Paste the raw LDAP user data in attribute: value format."}
        </p>
      </div>

      <Button type="submit" disabled={isLoading || !ldapData.trim()}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading
          ? batchMode
            ? "Importing Users..."
            : "Importing..."
          : batchMode
            ? "Import LDAP Users"
            : "Import LDAP User"}
      </Button>
    </form>
  )
}

