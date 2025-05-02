"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createMaterialOrder } from "@/app/crm/actions/materials"
import { getCompanies } from "@/app/crm/actions/companies"

const materialOrderSchema = z.object({
  vendorId: z.coerce.number({
    required_error: "Vendor is required",
    invalid_type_error: "Vendor is required",
  }),
  orderDate: z.date({
    required_error: "Order date is required",
  }),
  deliveryDate: z.date().optional(),
  status: z.enum(["PLANNED", "ORDERED", "PARTIALLY_DELIVERED", "DELIVERED", "CANCELLED"], {
    required_error: "Status is required",
  }),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  totalPrice: z.coerce.number().positive("Total price must be positive"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export default function MaterialOrderForm({ projectId, materialId, material }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(materialOrderSchema),
    defaultValues: {
      vendorId: "",
      orderDate: new Date(),
      deliveryDate: undefined,
      status: "PLANNED",
      quantity: material?.quantity || 0,
      unitPrice: 0,
      totalPrice: 0,
      invoiceNumber: "",
      notes: "",
    },
  })

  // Watch quantity and unit price to calculate total price
  const quantity = form.watch("quantity")
  const unitPrice = form.watch("unitPrice")

  useEffect(() => {
    if (quantity && unitPrice) {
      const total = quantity * unitPrice
      form.setValue("totalPrice", total)
    }
  }, [quantity, unitPrice, form])

  // Fetch vendors on component mount
  useEffect(() => {
    async function fetchVendors() {
      setLoading(true)
      try {
        const response = await getCompanies({ type: "VENDOR" })
        if (response.companies) {
          setVendors(response.companies)
        }
      } catch (error) {
        console.error("Error fetching vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      const result = await createMaterialOrder({
        bridgeMaterialId: materialId,
        ...data,
      })

      if (result.error) {
        form.setError("root", { message: result.error })
        return
      }

      // Navigate back to the project page
      router.push(`/crm/projects/${projectId}`)
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      form.setError("root", { message: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-1">Material Information</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Creating order for: <span className="font-medium">{material.name}</span>
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Specification:</span> {material.specification || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Total Quantity:</span> {material.quantity} {material.unit}
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Cost:</span>{" "}
                  {material.estimatedCost ? `$${material.estimatedCost}` : "N/A"}
                </div>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor*</FormLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No vendors available</div>
                        ) : (
                          vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                              {vendor.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="icon" asChild className="flex-shrink-0">
                    <Link
                      href={`/companies/new?type=VENDOR&returnUrl=/projects/${projectId}/materials/${materialId}/order/new`}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add Vendor</span>
                    </Link>
                  </Button>
                </div>
                {vendors.length === 0 && (
                  <FormDescription>
                    No vendors available.{" "}
                    <Link
                      href={`/companies/new?type=VENDOR&returnUrl=/projects/${projectId}/materials/${materialId}/order/new`}
                      className="underline"
                    >
                      Add a vendor
                    </Link>{" "}
                    first.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Status*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="ORDERED">Ordered</SelectItem>
                    <SelectItem value="PARTIALLY_DELIVERED">Partially Delivered</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Order Date*</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Delivery Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Available: {material.quantity} {material.unit}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Price*</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} readOnly />
                </FormControl>
                <FormDescription>Automatically calculated from quantity and unit price</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., INV-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this order" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loading || vendors.length === 0}>
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
