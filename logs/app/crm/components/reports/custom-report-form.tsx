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
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts"
import { toast } from "@/app/hooks/use-toast"

const customReportSchema = z.object({
  name: z.string().min(2, { message: "Report name must be at least 2 characters." }),
  description: z.string().optional(),
  dataSource: z.enum(["projects", "companies", "contacts", "materials", "inspections", "bids"]),
  metrics: z.array(z.string()).min(1, { message: "Select at least one metric" }),
  filters: z
    .array(
      z.object({
        field: z.string(),
        operator: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  groupBy: z.string().optional(),
  chartType: z.enum(["bar", "line", "pie", "radar", "area", "none"]),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
})

const metricOptions = {
  projects: [
    { id: "count", label: "Project Count" },
    { id: "budget_sum", label: "Total Budget" },
    { id: "budget_avg", label: "Average Budget" },
    { id: "duration_avg", label: "Average Duration" },
    { id: "status_distribution", label: "Status Distribution" },
  ],
  companies: [
    { id: "count", label: "Company Count" },
    { id: "type_distribution", label: "Type Distribution" },
    { id: "rating_avg", label: "Average Rating" },
    { id: "projects_count", label: "Projects Count" },
  ],
  contacts: [
    { id: "count", label: "Contact Count" },
    { id: "company_distribution", label: "Company Distribution" },
  ],
  materials: [
    { id: "count", label: "Material Count" },
    { id: "cost_sum", label: "Total Cost" },
    { id: "cost_avg", label: "Average Cost" },
    { id: "delivery_status", label: "Delivery Status" },
  ],
  inspections: [
    { id: "count", label: "Inspection Count" },
    { id: "result_distribution", label: "Result Distribution" },
    { id: "inspector_distribution", label: "Inspector Distribution" },
  ],
  bids: [
    { id: "count", label: "Bid Count" },
    { id: "amount_sum", label: "Total Bid Amount" },
    { id: "amount_avg", label: "Average Bid Amount" },
    { id: "status_distribution", label: "Status Distribution" },
  ],
}

const groupByOptions = {
  projects: [
    { id: "status", label: "Status" },
    { id: "bridge_type", label: "Bridge Type" },
    { id: "month", label: "Month" },
    { id: "quarter", label: "Quarter" },
  ],
  companies: [
    { id: "type", label: "Company Type" },
    { id: "industry", label: "Industry" },
    { id: "rating", label: "Rating" },
  ],
  contacts: [
    { id: "company", label: "Company" },
    { id: "expertise", label: "Expertise" },
  ],
  materials: [
    { id: "project", label: "Project" },
    { id: "vendor", label: "Vendor" },
    { id: "status", label: "Status" },
  ],
  inspections: [
    { id: "project", label: "Project" },
    { id: "phase", label: "Phase" },
    { id: "result", label: "Result" },
    { id: "inspector", label: "Inspector" },
  ],
  bids: [
    { id: "project", label: "Project" },
    { id: "company", label: "Company" },
    { id: "status", label: "Status" },
  ],
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function CustomReportForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState("projects")
  const [previewData, setPreviewData] = useState(null)
  const [reportGenerated, setReportGenerated] = useState(false)

  const form = useForm({
    resolver: zodResolver(customReportSchema),
    defaultValues: {
      name: "",
      description: "",
      dataSource: "projects",
      metrics: [],
      filters: [],
      groupBy: "none",
      chartType: "bar",
      dateRange: {
        from: undefined,
        to: undefined,
      },
    },
  })

  // Watch for data source changes using useEffect instead of during render
  const dataSource = form.watch("dataSource")

  useEffect(() => {
    if (dataSource !== selectedDataSource) {
      setSelectedDataSource(dataSource)
      form.setValue("metrics", [])
      form.setValue("groupBy", "none")
    }
  }, [dataSource, selectedDataSource, form])

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      // In a real app, you would save the report configuration to the database
      console.log("Report configuration:", data)

      // Generate preview data
      const generatedData = await generatePreviewData(data)
      setPreviewData(generatedData)
      setReportGenerated(true)

      // Show success toast
      toast({
        title: "Report Generated",
        description: "Your custom report has been successfully generated.",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      form.setError("root", { message: "An unexpected error occurred" })
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock function to generate preview data
  async function generatePreviewData(data) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate different data based on the data source and metrics
    let chartData = []
    let summaryData = {}

    switch (data.dataSource) {
      case "projects":
        if (data.groupBy === "status") {
          chartData = [
            { name: "Planning", value: 4 },
            { name: "In Progress", value: 7 },
            { name: "On Hold", value: 2 },
            { name: "Completed", value: 5 },
            { name: "Cancelled", value: 1 },
          ]
          summaryData = {
            total: 19,
            average: 3.8,
            min: 1,
            max: 7,
          }
        } else if (data.groupBy === "bridge_type") {
          chartData = [
            { name: "Arch", value: 3 },
            { name: "Beam", value: 5 },
            { name: "Cable-stayed", value: 2 },
            { name: "Suspension", value: 4 },
            { name: "Truss", value: 6 },
          ]
          summaryData = {
            total: 20,
            average: 4,
            min: 2,
            max: 6,
          }
        } else {
          chartData = [
            { name: "Jan", value: 400000 },
            { name: "Feb", value: 300000 },
            { name: "Mar", value: 600000 },
            { name: "Apr", value: 800000 },
            { name: "May", value: 500000 },
            { name: "Jun", value: 700000 },
          ]
          summaryData = {
            total: 3300000,
            average: 550000,
            min: 300000,
            max: 800000,
          }
        }
        break

      case "companies":
        if (data.groupBy === "type") {
          chartData = [
            { name: "Contractor", value: 12 },
            { name: "Supplier", value: 8 },
            { name: "Consultant", value: 5 },
            { name: "Other", value: 3 },
          ]
          summaryData = {
            total: 28,
            average: 7,
            min: 3,
            max: 12,
          }
        } else {
          chartData = [
            { name: "Rating 1", value: 2 },
            { name: "Rating 2", value: 3 },
            { name: "Rating 3", value: 8 },
            { name: "Rating 4", value: 10 },
            { name: "Rating 5", value: 5 },
          ]
          summaryData = {
            total: 28,
            average: 3.5,
            min: 2,
            max: 10,
          }
        }
        break

      case "materials":
        chartData = [
          { name: "Steel", value: 450000 },
          { name: "Concrete", value: 320000 },
          { name: "Timber", value: 180000 },
          { name: "Asphalt", value: 240000 },
          { name: "Other", value: 110000 },
        ]
        summaryData = {
          total: 1300000,
          average: 260000,
          min: 110000,
          max: 450000,
        }
        break

      case "inspections":
        chartData = [
          { name: "Passed", value: 32 },
          { name: "Failed", value: 8 },
          { name: "Conditional", value: 14 },
        ]
        summaryData = {
          total: 54,
          passRate: "59%",
          failRate: "15%",
        }
        break

      case "bids":
        chartData = [
          { name: "Won", value: 8 },
          { name: "Lost", value: 12 },
          { name: "Pending", value: 5 },
          { name: "Withdrawn", value: 3 },
        ]
        summaryData = {
          total: 28,
          winRate: "29%",
          averageAmount: "$345,200",
        }
        break

      default:
        chartData = [
          { name: "Category 1", value: 400 },
          { name: "Category 2", value: 300 },
          { name: "Category 3", value: 600 },
          { name: "Category 4", value: 200 },
          { name: "Category 5", value: 500 },
        ]
        summaryData = {
          total: 2000,
          average: 400,
          min: 200,
          max: 600,
        }
    }

    return {
      chartData,
      summary: summaryData,
      reportName: data.name,
      reportDescription: data.description,
      chartType: data.chartType,
      dataSource: data.dataSource,
      metrics: data.metrics,
      groupBy: data.groupBy,
    }
  }

  function handleExportReport() {
    // In a real app, this would generate a file download
    toast({
      title: "Report Exported",
      description: "Your report has been downloaded as a PDF file.",
    })
  }

  function renderChart() {
    if (!previewData || !previewData.chartData) return null

    const { chartData, chartType } = previewData

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name="Value" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case "none":
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right">{item.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
    }
  }

  function renderSummary() {
    if (!previewData || !previewData.summary) return null

    const { summary, dataSource } = previewData
    const summaryItems = Object.entries(summary).map(([key, value]) => {
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")

      return (
        <div key={key} className="flex flex-col items-center p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">{formattedKey}</span>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      )
    })

    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">{summaryItems}</div>
  }

  return (
    <>
      {reportGenerated ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{previewData.reportName}</h2>
              {previewData.reportDescription && (
                <p className="text-muted-foreground">{previewData.reportDescription}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReportGenerated(false)}>
                Edit Report
              </Button>
              <Button onClick={handleExportReport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {previewData.dataSource.charAt(0).toUpperCase() + previewData.dataSource.slice(1)} Report
                {previewData.groupBy && previewData.groupBy !== "none" && (
                  <span className="text-muted-foreground text-sm font-normal ml-2">
                    Grouped by {previewData.groupBy.replace(/_/g, " ")}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart()}
              {renderSummary()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter report name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Source*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="companies">Companies</SelectItem>
                        <SelectItem value="contacts">Contacts</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="inspections">Inspections</SelectItem>
                        <SelectItem value="bids">Bids</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Enter report description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Metrics & Visualization</h3>

              <FormField
                control={form.control}
                name="metrics"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Metrics*</FormLabel>
                      <FormDescription>Select the metrics to include in your report</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {metricOptions[selectedDataSource].map((metric) => (
                        <FormField
                          key={metric.id}
                          control={form.control}
                          name="metrics"
                          render={({ field }) => {
                            return (
                              <FormItem key={metric.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(metric.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, metric.id])
                                        : field.onChange(field.value?.filter((value) => value !== metric.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{metric.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="groupBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group By</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grouping" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {groupByOptions[selectedDataSource].map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
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
                  name="chartType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chart Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chart type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="radar">Radar Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="none">No Chart (Table Only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range</FormLabel>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value?.from && "text-muted-foreground",
                              )}
                            >
                              {field.value?.from ? format(field.value.from, "PPP") : <span>From date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value?.from}
                            onSelect={(date) => field.onChange({ ...field.value, from: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <span>to</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value?.to && "text-muted-foreground",
                              )}
                            >
                              {field.value?.to ? format(field.value.to, "PPP") : <span>To date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value?.to}
                            onSelect={(date) => field.onChange({ ...field.value, to: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  )
}
