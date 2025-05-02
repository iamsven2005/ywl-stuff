"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getProjects } from "@/app/crm/actions/projects"
import { getCompanies } from "@/app/crm/actions/companies"

const materialOrderSchema = z.object({
  projectId: z.coerce.number(),
  materialId: z.coerce.number(),
  vendorId: z.coerce.number(),
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  status: z.enum(["PLANNED", "ORDERED", "PARTIALLY_DELIVERED", "DELIVERED", "CANCELLED"]),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
})

export default function OrderForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noVendors, setNoVendors] = useState(false)
  const [noMaterials, setNoMaterials] = useState(false)

  const form = useForm({
    resolver: zodResolver(materialOrderSchema),
    defaultValues: {
      projectId: "",
      materialId: "",
      vendorId: "",
      orderDate: new Date(),
      deliveryDate: undefined,
      status: "PLANNED",
      quantity: 0,
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

  // Fetch projects, vendors on component mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch projects
        const projectsResponse = await getProjects()
        if (projectsResponse.projects) {
          setProjects(projectsResponse.projects)
        }

        // Fetch vendors
        const vendorsResponse = await getCompanies({ type: "VENDOR" })
        if (vendorsResponse.companies) {
          setVendors(vendorsResponse.companies)
          setNoVendors(vendorsResponse.companies.length === 0)
        } else {
          setNoVendors(true)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setNoVendors(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch materials when project changes
  async function fetchMaterialsForProject(projectId) {
    try {
      setSelectedProject(projectId)
      // In a real app, this would be an API call
      // For now, we'll simulate it by filtering projects
      const project = projects.find((p) => p.id === Number.parseInt(projectId))

      if (
        project &&
        project.bridgeProject &&
        project.bridgeProject.materials &&
        project.bridgeProject.materials.length > 0
      ) {
        setMaterials(project.bridgeProject.materials)
        setNoMaterials(false)
      } else {
        // Simulate API call
        const dummyMaterials = [
          { id: 1, name: "Structural Steel", specification: "ASTM A992", unit: "tons" },
          { id: 2, name: "Concrete", specification: "5000 PSI", unit: "cubic yards" },
          { id: 3, name: "Rebar", specification: "Grade 60", unit: "tons" },
        ]
        setMaterials(dummyMaterials)
        setNoMaterials(true)
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      setNoMaterials(true)
    }
  }

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      // In a real app, this would call the API
      console.log("Order data:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Navigate to orders page
      router.push("/crm/orders")
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
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project*</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    fetchMaterialsForProject(value)
                  }}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="materialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material*</FormLabel>
                {noMaterials && selectedProject ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No materials found for this project.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/crm/projects/${selectedProject}/materials/new`)}
                    >
                      Add Material to Project
                    </Button>
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} ({material.specification})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor*</FormLabel>
                {noVendors ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No vendors found in the system.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/crm/companies/new?type=VENDOR")}
                    >
                      Add New Vendor
                    </Button>
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <Button type="submit" disabled={isSubmitting || loading || noVendors || (noMaterials && selectedProject)}>
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
