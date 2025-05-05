
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { createProject } from "../../actions/projects"

const projectSchema = z.object({
  businessCode: z.string().min(2, { message: "Business code must be at least 2 characters." }),
  projectCode: z.string().min(2, { message: "Project code must be at least 2 characters." }),
  name: z.string().min(2, { message: "Project name must be at least 2 characters." }),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date().optional(),
  estimatedEndDate: z.date().optional(),
  budget: z.coerce.number().positive().optional(),
  status: z.enum([
    "PLANNING",
    "BIDDING",
    "DESIGN",
    "PERMITTING",
    "CONSTRUCTION",
    "INSPECTION",
    "COMPLETED",
    "ON_HOLD",
    "CANCELLED",
  ]),
  bridgeType: z.enum([
    "ARCH",
    "BEAM",
    "TRUSS",
    "SUSPENSION",
    "CABLE_STAYED",
    "CANTILEVER",
    "MOVABLE",
    "CULVERT",
    "OTHER",
  ]),
  spanLength: z.coerce.number().positive().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  loadCapacity: z.coerce.number().positive().optional(),
  waterway: z.string().optional(),
  environmentalConsiderations: z.string().optional(),
  trafficImpact: z.string().optional(),
})

export default function ProjectForm({ project = null }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          ...project,
          bridgeType: project.bridgeProject?.bridgeType,
          spanLength: project.bridgeProject?.spanLength,
          width: project.bridgeProject?.width,
          height: project.bridgeProject?.height,
          loadCapacity: project.bridgeProject?.loadCapacity,
          waterway: project.bridgeProject?.waterway,
          environmentalConsiderations: project.bridgeProject?.environmentalConsiderations,
          trafficImpact: project.bridgeProject?.trafficImpact,
        }
      : {
          businessCode: "",
          projectCode: "",
          name: "",
          description: "",
          location: "",
          startDate: undefined,
          estimatedEndDate: undefined,
          budget: undefined,
          status: "PLANNING",
          bridgeType: "BEAM",
          spanLength: undefined,
          width: undefined,
          height: undefined,
          loadCapacity: undefined,
          waterway: "",
          environmentalConsiderations: "",
          trafficImpact: "",
        },
  })

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      // Separate bridge project data from main project data
      const {
        bridgeType,
        spanLength,
        width,
        height,
        loadCapacity,
        waterway,
        environmentalConsiderations,
        trafficImpact,
        ...projectData
      } = data

      const projectPayload = {
        ...projectData,
        bridgeProject: {
          bridgeType,
          spanLength,
          width,
          height,
          loadCapacity,
          waterway,
          environmentalConsiderations,
          trafficImpact,
        },
      }

      if (project) {
        // Update existing project (not implemented yet)
        // await updateProject(project.id, projectPayload)
      } else {
        // Create new project
        const result = await createProject(projectPayload)

        if (result.error) {
          form.setError("root", { message: result.error })
          return
        }

        router.push(`/crm/projects/${result.project.id}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      form.setError("root", { message: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" asChild>
        <Link href="/crm/projects">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">Create New Project</h1>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>Enter the details for your new bridge project</CardDescription>
      </CardHeader>
      <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="businessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Code*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BR-2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., P-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Project Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main St & River Rd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="BIDDING">Bidding</SelectItem>
                      <SelectItem value="DESIGN">Design</SelectItem>
                      <SelectItem value="PERMITTING">Permitting</SelectItem>
                      <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                      <SelectItem value="INSPECTION">Inspection</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
              name="estimatedEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Estimated End Date</FormLabel>
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
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="e.g., 1000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter project description" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Bridge Specifications</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bridgeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bridge Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bridge type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARCH">Arch</SelectItem>
                      <SelectItem value="BEAM">Beam</SelectItem>
                      <SelectItem value="TRUSS">Truss</SelectItem>
                      <SelectItem value="SUSPENSION">Suspension</SelectItem>
                      <SelectItem value="CABLE_STAYED">Cable-Stayed</SelectItem>
                      <SelectItem value="CANTILEVER">Cantilever</SelectItem>
                      <SelectItem value="MOVABLE">Movable</SelectItem>
                      <SelectItem value="CULVERT">Culvert</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="waterway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waterway</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mississippi River" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spanLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Span Length (meters)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (meters)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" placeholder="e.g., 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (meters)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" placeholder="e.g., 25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Capacity (tons)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.1" placeholder="e.g., 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environmentalConsiderations"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Environmental Considerations</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter environmental considerations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trafficImpact"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Traffic Impact</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter traffic impact details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root && <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
              </CardContent>
              </Card>
            </main>
  )
}
