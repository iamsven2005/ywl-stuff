import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Wrench } from "lucide-react"

export default function EquipmentMaintenance({ maintenanceRecords = [] }) {
  const getMaintenanceTypeBadge = (type) => {
    switch (type) {
      case "ROUTINE":
        return <Badge className="bg-green-100 text-green-800">Routine</Badge>
      case "REPAIR":
        return <Badge className="bg-yellow-100 text-yellow-800">Repair</Badge>
      case "CALIBRATION":
        return <Badge className="bg-blue-100 text-blue-800">Calibration</Badge>
      case "INSPECTION":
        return <Badge className="bg-purple-100 text-purple-800">Inspection</Badge>
      case "REPLACEMENT":
        return <Badge className="bg-red-100 text-red-800">Replacement</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance History</CardTitle>
        <CardDescription>Record of all maintenance activities</CardDescription>
      </CardHeader>
      <CardContent>
        {maintenanceRecords.length > 0 ? (
          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(record.startDate)}
                      {record.endDate && ` to ${formatDate(record.endDate)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getMaintenanceTypeBadge(record.maintenanceType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.performedBy || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.cost ? formatCurrency(record.cost) : "N/A"}</td>
                    <td className="px-6 py-4">{record.description || record.notes || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No maintenance records found</p>
            <Button className="mt-4" asChild>
              <Link href={`/equipment/${maintenanceRecords[0]?.equipmentId || 0}/maintenance`}>
                Schedule Maintenance
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
