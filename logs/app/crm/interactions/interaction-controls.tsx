"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"


export default function InteractionControls({
  initialSearch = "",
}: {
  initialSearch?: string
  initialType?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(initialSearch || "")
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }
    router.push(`/crm/interactions?${params.toString()}`)
  }


  return (
    <div className="flex items-center gap-4">
      <form className="relative flex-1" onSubmit={handleSearch}>
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interactions..."
          className="w-full pl-8"
        />
      </form>


    </div>
  )
}
