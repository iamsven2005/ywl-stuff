import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HardHat, Search, Plus } from "lucide-react"
import { getAllMaterialOrders } from "@/app/crm/actions/materials"
import { formatDate, formatCurrency } from "@/lib/utils"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const { orders, error } = await getAllMaterialOrders()

  // Filter orders by status if provided
  const filteredOrders = searchParams.status ? orders?.filter((o) => o.status === searchParams.status) : orders

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          <h1 className="text-lg font-semibold">BridgeCRM</h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/projects">Projects</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/companies">Companies</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/contacts">Contacts</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/reports">Reports</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Material Orders</h1>
          <Button asChild>
            <Link href="/crm/orders/new">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <form className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" name="search" placeholder="Search orders..." className="w-full pl-8" />
          </form>
          <Select defaultValue={searchParams.status || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="ORDERED">Ordered</SelectItem>
              <SelectItem value="PARTIALLY_DELIVERED">Partially Delivered</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {searchParams.status ? `${searchParams.status.replace("_", " ")} Orders` : "All Orders"}
            </CardTitle>
            <CardDescription>Manage material orders across all projects</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center">
                <p className="text-red-500">Error loading orders: {error}</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-7 p-4 font-medium border-b">
                  <div>Material</div>
                  <div>Project</div>
                  <div>Vendor</div>
                  <div>Quantity</div>
                  <div>Total Price</div>
                  <div>Status</div>
                  <div>Delivery Date</div>
                </div>
                <div className="divide-y">
                  {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="grid grid-cols-7 p-4 hover:bg-muted/50">
                        <div className="font-medium">
                          <Link href={`/crm/orders/${order.id}`} className="hover:underline">
                            {order.bridgeMaterial.name}
                          </Link>
                        </div>
                        <div>
                          <Link
                            href={`/crm/projects/${order.bridgeMaterial.bridgeProject.projectId}`}
                            className="hover:underline"
                          >
                            {order.bridgeMaterial.bridgeProject.project.name}
                          </Link>
                        </div>
                        <div>
                          <Link href={`/crm/companies/${order.vendor.id}`} className="hover:underline">
                            {order.vendor.name}
                          </Link>
                        </div>
                        <div>
                          {order.quantity} {order.bridgeMaterial.unit}
                        </div>
                        <div>{formatCurrency(order.totalPrice)}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              order.status === "ORDERED"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "PARTIALLY_DELIVERED"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "PLANNED"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <div>{formatDate(order.deliveryDate)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No orders found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
