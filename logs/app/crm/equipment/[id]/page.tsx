import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { HardHat, ArrowLeft, Edit, PenToolIcon as Tool, Calendar, Clock, Wrench, ShoppingBag } from "lucide-react"
import { getEquipmentById } from "@/app/actions/equipment"
import { formatDate, formatCurrency } from "@/lib/utils"
import EquipmentLoans from "@/components/equipment-loans"
import EquipmentMaintenance from "@/components/equipment-maintenance"

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const equipmentId = Number.parseInt(params.id)
  const { equipment, error } = await getEquipmentById(equipmentId)

  if (error || !equipment) {
    return notFound()
  }

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/crm/equipment">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{equipment.name}</h1>
          <Badge className="ml-2">{equipment.itemCode}</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/crm/equipment/${equipment.id}/checkout`}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Check Out
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/crm/equipment/${equipment.id}/maintenance`}>
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/crm/equipment/${equipment.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge
                  className={`text-md ${
                    equipment.status === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : equipment.status === "ON_LOAN"
                        ? "bg-blue-100 text-blue-800"
                        : equipment.status === "IN_MAINTENANCE"
                          ? "bg-yellow-100 text-yellow-800"
                          : equipment.status === "DAMAGED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {equipment.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Condition: {equipment.condition}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability</CardTitle>
              <Tool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {equipment.availableQuantity} / {equipment.totalQuantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {equipment.onLoanQuantity} on loan, {equipment.damagedQuantity} damaged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Category</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{equipment.category.name}</div>
              <p className="text-xs text-muted-foreground">Location: {equipment.location || "Not specified"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {equipment.lastMaintenanceDate ? formatDate(equipment.lastMaintenanceDate) : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">
                Next: {equipment.nextMaintenanceDate ? formatDate(equipment.nextMaintenanceDate) : "Not scheduled"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
            <CardDescription>Specifications and purchase information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                <dl className="grid grid-cols-3 gap-1">
                  <dt className="col-span-1 font-medium text-muted-foreground">Manufacturer:</dt>
                  <dd className="col-span-2">{equipment.manufacturer || "N/A"}</dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Model:</dt>
                  <dd className="col-span-2">{equipment.model || "N/A"}</dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Serial Number:</dt>
                  <dd className="col-span-2">{equipment.serialNumber || "N/A"}</dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Description:</dt>
                  <dd className="col-span-2">{equipment.description || "N/A"}</dd>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Purchase Information</h3>
                <dl className="grid grid-cols-3 gap-1">
                  <dt className="col-span-1 font-medium text-muted-foreground">Purchase Date:</dt>
                  <dd className="col-span-2">{equipment.purchaseDate ? formatDate(equipment.purchaseDate) : "N/A"}</dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Purchase Price:</dt>
                  <dd className="col-span-2">
                    {equipment.purchasePrice ? formatCurrency(equipment.purchasePrice) : "N/A"}
                  </dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Warranty Until:</dt>
                  <dd className="col-span-2">
                    {equipment.warrantyExpiry ? formatDate(equipment.warrantyExpiry) : "N/A"}
                  </dd>

                  <dt className="col-span-1 font-medium text-muted-foreground">Notes:</dt>
                  <dd className="col-span-2">{equipment.notes || "N/A"}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="loans">
          <TabsList>
            <TabsTrigger value="loans">Loan History</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
            <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
          </TabsList>
          <TabsContent value="loans" className="border-none p-0 pt-4">
            <EquipmentLoans loans={equipment.loans} />
          </TabsContent>
          <TabsContent value="maintenance" className="border-none p-0 pt-4">
            <EquipmentMaintenance maintenanceRecords={equipment.maintenanceRecords} />
          </TabsContent>
          <TabsContent value="allocations" className="border-none p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Allocations</CardTitle>
                <CardDescription>Projects this equipment is allocated to</CardDescription>
              </CardHeader>
              <CardContent>
                {equipment.allocations && equipment.allocations.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Start Date
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            End Date
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {equipment.allocations.map((allocation) => (
                          <tr key={allocation.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/crm/projects/${allocation.project.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {allocation.project.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{allocation.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(allocation.startDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {allocation.endDate ? formatDate(allocation.endDate) : "Ongoing"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{allocation.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No project allocations found</p>
                    <Button className="mt-4" asChild>
                      <Link href={`/crm/equipment/${equipment.id}/allocate`}>Allocate to Project</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
  )
}
