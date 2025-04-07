import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ScrollableRoles({ roles }: { roles: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState("")

  const filteredRoles = roles.filter((role) =>
    role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar */}
      <Input
        placeholder="Search roles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      {/* Scrollable badge container */}
      <div
        className={`${
          expanded ? "max-h-[300px]" : "max-h-24"
        } overflow-y-auto pr-1 flex flex-wrap gap-1 border rounded-md p-2`}
      >
        {filteredRoles.length > 0 ? (
          filteredRoles.map((role) => (
            <span
              key={role}
              className="bg-muted text-sm rounded px-2 py-1 capitalize whitespace-nowrap"
            >
              {role}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No matching roles.</span>
        )}
      </div>

      {/* Toggle expand/collapse */}
      {roles.length > 5 && (
        <Button
          variant="link"
          className="px-0 text-sm w-fit self-end"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Collapse" : "Show All"}
        </Button>
      )}
    </div>
  )
}
