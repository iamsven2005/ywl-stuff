"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, PenToolIcon as Tool, ArrowUpDown } from "lucide-react"

export default function EquipmentList({ equipment, categories }) {
  const [sortField, setSortField] = useState("itemCode")
  const [sortDirection, setSortDirection] = useState("asc")

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedEquipment = [...equipment].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    // Handle nested fields like category.name
    if (sortField === "category") {
      aValue = a.category?.name || ""
      bValue = b.category?.name || ""
    }

    // Handle numeric values
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    // Handle string values
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Unknown"
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800"
      case "ON_LOAN":
        return "bg-blue-100 text-blue-800"
      case "IN_MAINTENANCE":
        return "bg-yellow-100 text-yellow-800"
      case "DAMAGED":
        return "bg-red-100 text-red-800"
      case "RETIRED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800"
      case "GOOD":
        return "bg-green-100 text-green-800"
      case "FAIR":
        return "bg-yellow-100 text-yellow-800"
      case "POOR":
        return "bg-orange-100 text-orange-800"
      case "UNUSABLE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("itemCode")}>
              <div className="flex items-center">
                Code
                {sortField === "itemCode" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              <div className="flex items-center">
                Name
                {sortField === "name" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
              <div className="flex items-center">
                Category
                {sortField === "category" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("availableQuantity")}>
              <div className="flex items-center">
                Available
                {sortField === "availableQuantity" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("totalQuantity")}>
              <div className="flex items-center">
                Total
                {sortField === "totalQuantity" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
              <div className="flex items-center">
                Status
                {sortField === "status" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("condition")}>
              <div className="flex items-center">
                Condition
                {sortField === "condition" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEquipment.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <Tool className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No equipment found</p>
                  <Button asChild>
                    <Link href="/equipment/new">Add Equipment</Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedEquipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.itemCode}</TableCell>
                <TableCell>
                  <Link href={`/equipment/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                <TableCell>{item.availableQuantity}</TableCell>
                <TableCell>{item.totalQuantity}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(item.status)}>{item.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getConditionBadgeColor(item.condition)}>{item.condition}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/equipment/${item.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/equipment/${item.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/equipment/${item.id}/checkout`}>Check Out</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/equipment/${item.id}/maintenance`}>Maintenance</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
