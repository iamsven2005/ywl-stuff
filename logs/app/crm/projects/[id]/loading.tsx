import { HardHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ProjectDetailSkeleton from "../../components/skeletons/project-detail-skeleton"

export default function Loading() {
  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <ProjectDetailSkeleton />
      </main>
        )
}
