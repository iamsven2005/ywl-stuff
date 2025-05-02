"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Plus, Pencil, Trash2, ShoppingCart } from "lucide-react"
import { deleteMaterial } from "@/app/crm/actions/materials"
import { formatCurrency } from "@/lib/utils"

export default function ProjectMaterials({ projectId, materials = [] }) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [materialToAssign, setMaterialToAssign] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDeleteClick = (material) => {
    setMaterialToDelete(material)
    setDeleteDialogOpen(true)
  }

  const handleAssignClick = (material) => {
    setMaterialToAssign(material)
    setAssignDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!materialToDelete) return

    setIsDeleting(true)
    setError("")

    try {
      const result = await deleteMaterial(materialToDelete.id)

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
    } catch (err) {
      setError("Failed to delete material. Please try again.")
      console.error(err)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleCreateOrder = (materialId) => {
    router.push(`/crm/projects/${projectId}/materials/${materialId}/order/new`)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Materials</CardTitle>
            <CardDescription>Manage materials for this project</CardDescription>
          </div>
          <Button className="ml-auto" size="sm" asChild>
            <Link href={`/crm/projects/${projectId}/materials/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">No materials have been added to this project yet.</p>
              <Button asChild>
                <Link href={`/crm/projects/${projectId}/materials/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Material
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specification</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.specification || "-"}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{material.estimatedCost ? formatCurrency(material.estimatedCost) : "-"}</TableCell>
                    <TableCell>{material.orders?.length || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCreateOrder(material.id)}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Create Order
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/projects/${projectId}/materials/${material.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(material)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {materialToDelete?.name}? This action cannot be undone.
              {materialToDelete?.orders?.length > 0 && (
                <p className="mt-2 text-destructive">
                  Warning: This material has {materialToDelete.orders.length} orders associated with it. Deleting it
                  will also delete all related orders.
                </p>
              )}
              {error && <p className="mt-2 text-destructive">{error}</p>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Order for {materialToAssign?.name}</DialogTitle>
            <DialogDescription>Create a new order to assign this material to a vendor.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAssignDialogOpen(false)
                if (materialToAssign) {
                  handleCreateOrder(materialToAssign.id)
                }
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
