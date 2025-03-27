"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function EmergencyContactForm({ user, onSubmit, isSubmitting }: any) {
  const [formData, setFormData] = useState({
    Mobile: user.Mobile || "",
    PrimaryContact: user.PrimaryContact || "",
    MobileContact: user.MobileContact || "",
    Relationship: user.Relationship || "",
    SecondContact: user.SecondContact || "",
    SecondMobile: user.SecondMobile || "",
    SecondRelationship: user.SecondRelationship || "",
    Remarks: user.Remarks || "",
  })

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Mobile") ? (value ? Number.parseInt(value) : "") : value,
    }))
  }

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-500 text-white p-2 font-medium">
        In the event of an emergency, please list the name and mobile number of the person to contact:
      </div>

      <div className="grid grid-cols-[150px_1fr] items-center gap-2">
        <Label htmlFor="staffName" className="bg-blue-400 text-white p-2">
          Staff Name:
        </Label>
        <div className="font-medium">{user.username}</div>

        <Label htmlFor="Mobile" className="bg-blue-400 text-white p-2">
          Mobile No.
        </Label>
        <Input
          id="Mobile"
          name="Mobile"
          type="number"
          value={formData.Mobile || ""}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div className="mt-8 mb-4 font-medium">Emergency Contact Information</div>

      <div className="grid grid-cols-[200px_1fr] items-center gap-2">
        <Label htmlFor="PrimaryContact" className="bg-blue-400 text-white p-2">
          Primary Contact Name:
        </Label>
        <Input
          id="PrimaryContact"
          name="PrimaryContact"
          value={formData.PrimaryContact || ""}
          onChange={handleChange}
          className="w-full"
        />

        <Label htmlFor="MobileContact" className="bg-blue-400 text-white p-2">
          Mobile No.:
        </Label>
        <Input
          id="MobileContact"
          name="MobileContact"
          type="number"
          value={formData.MobileContact || ""}
          onChange={handleChange}
          className="w-full"
        />

        <Label htmlFor="Relationship" className="bg-blue-400 text-white p-2">
          Relationship:
        </Label>
        <Input
          id="Relationship"
          name="Relationship"
          value={formData.Relationship || ""}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div className="mt-8 mb-4 font-medium">Optional:</div>

      <div className="grid grid-cols-[200px_1fr] items-center gap-2">
        <Label htmlFor="SecondContact" className="bg-blue-400 text-white p-2">
          Secondary Contact Name:
        </Label>
        <Input
          id="SecondContact"
          name="SecondContact"
          value={formData.SecondContact || ""}
          onChange={handleChange}
          className="w-full"
        />

        <Label htmlFor="SecondMobile" className="bg-blue-400 text-white p-2">
          Mobile No.:
        </Label>
        <Input
          id="SecondMobile"
          name="SecondMobile"
          type="number"
          value={formData.SecondMobile || ""}
          onChange={handleChange}
          className="w-full"
        />

        <Label htmlFor="SecondRelationship" className="bg-blue-400 text-white p-2">
          Relationship:
        </Label>
        <Input
          id="SecondRelationship"
          name="SecondRelationship"
          value={formData.SecondRelationship || ""}
          onChange={handleChange}
          className="w-full"
        />

        <Label htmlFor="Remarks" className="bg-blue-400 text-white p-2 h-full">
          Remarks:
        </Label>
        <Textarea
          id="Remarks"
          name="Remarks"
          value={formData.Remarks || ""}
          onChange={handleChange}
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="text-sm text-gray-500 mt-4">
        Last saved by {user.username} on {new Date(user.updatedAt).toLocaleString()}
      </div>
    </form>
  )
}

