import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { ShoppingBag } from "lucide-react"

export default function EquipmentLoans({ loans = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan History</CardTitle>
        <CardDescription>Track when this equipment was checked out and returned</CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length > 0 ? (
          <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checkout Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project/Company
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checked Out By
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(loan.checkoutDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loan.actualReturnDate ? (
                        formatDate(loan.actualReturnDate)
                      ) : (
                        <span className="text-muted-foreground">Expected: {formatDate(loan.expectedReturnDate)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loan.project ? (
                        <Link href={`/crm/projects/${loan.project.id}`} className="text-blue-600 hover:underline">
                          {loan.project.name}
                        </Link>
                      ) : loan.company ? (
                        <Link href={`/crm/companies/${loan.company.id}`} className="text-blue-600 hover:underline">
                          {loan.company.name}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{loan.checkedOutBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={loan.actualReturnDate ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
                      >
                        {loan.actualReturnDate ? "Returned" : "Active"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No loan history found</p>
            <Button className="mt-4" asChild>
              <Link href={`/crm/equipment/${loans[0]?.equipmentId || 0}/checkout`}>Check Out Equipment</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
