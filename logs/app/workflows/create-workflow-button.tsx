"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

interface CreateWorkflowButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function CreateWorkflowButton({ variant = "default", size = "default", className }: CreateWorkflowButtonProps) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href="/workflows/new">
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Workflow
      </Link>
    </Button>
  )
}
