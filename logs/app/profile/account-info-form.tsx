"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function AccountInfoForm({ user, onSubmit, isSubmitting }: any) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
  })

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label htmlFor="username">Username:</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full"
              disabled
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label htmlFor="email">Email:</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Role:</Label>
            <div>{user.role.join(", ")}</div>
          </div>

          <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <Label>Member Since:</Label>
            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Update Account"}
        </Button>
      </div>
    </form>
  )
}

