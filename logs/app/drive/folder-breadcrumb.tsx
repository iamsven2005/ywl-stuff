import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface FolderBreadcrumbProps {
  path: Array<{ id: number | null; name: string }>
}

export function FolderBreadcrumb({ path }: FolderBreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <ol className="flex items-center flex-wrap">
        {path.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}

            <Link
              href={item.id === null ? "/drive" : `/drive?folder=${item.id}`}
              className={`hover:text-foreground flex items-center ${
                index === path.length - 1 ? "font-medium text-foreground" : ""
              }`}
            >
              {index === 0 && <Home className="h-4 w-4 mr-1" />}
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

