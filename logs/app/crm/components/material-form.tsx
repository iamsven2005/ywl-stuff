"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMaterial, updateMaterial } from "@/app/crm/actions/materials"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specification: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  estimatedCost: z.coerce.number().optional(),
})

export default function MaterialForm({ projectId, material = null }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!material

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: material
      ? {
          name: material.name,
          specification: material.specification || "",
          quantity: material.quantity,
          unit: material.unit,
          estimatedCost: material.estimatedCost || undefined,
        }
      : {
          name: "",
          specification: "",
          quantity: 0,
          unit: "",
          estimatedCost: undefined,
        },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        // Update existing material
        const result = await updateMaterial(material.id, {
          name: values.name,
          specification: values.specification,
          quantity: values.quantity,
          unit: values.unit,
          estimatedCost: values.estimatedCost,
        })

        if (result.error) {
          console.error(result.error)
          return
        }
      } else {
        // Create new material
        const bridgeProjectId = material?.bridgeProject?.id || projectId

        const result = await createMaterial({
          bridgeProjectId,
          name: values.name,
          specification: values.specification,
          quantity: values.quantity,
          unit: values.unit,
          estimatedCost: values.estimatedCost,
        })

        if (result.error) {
          console.error(result.error)
          return
        }
      }

      router.push(`/projects/${projectId}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const unitOptions = [
    "tons",
    "cubic yards",
    "cubic meters",
    "square feet",
    "square meters",
    "linear feet",
    "linear meters",
    "each",
    "boxes",
    "pallets",
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name*</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Structural Steel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specification</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ASTM A992" {...field} />
              </FormControl>
              <FormDescription>Technical specifications or standards for this material</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estimatedCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Cost (per unit)</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>Estimated cost per unit in dollars</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : isEditing ? "Update Material" : "Add Material"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
