import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CompanyList({ companies }) {
  if (!companies || companies.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No companies found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-6 p-4 font-medium border-b">
        <div>Company Name</div>
        <div>Type</div>
        <div>Industry</div>
        <div>Specialties</div>
        <div>Rating</div>
        <div>Actions</div>
      </div>
      <div className="divide-y">
        {companies.map((company) => (
          <div key={company.id} className="grid grid-cols-6 p-4 hover:bg-muted/50">
            <div className="font-medium">
              <Link href={`/crm/companies/${company.id}`} className="hover:underline">
                {company.name}
              </Link>
            </div>
            <div>
              <CompanyTypeBadge type={company.type} />
            </div>
            <div>{company.industry || "N/A"}</div>
            <div>{company.specialties?.join(", ") || "N/A"}</div>
            <div className="flex items-center">
              {company.rating ? (
                <>
                  <div className="text-yellow-500">
                    {Array.from({ length: Math.floor(company.rating) }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    {Array.from({ length: 5 - Math.floor(company.rating) }).map((_, i) => (
                      <span key={i}>☆</span>
                    ))}
                  </div>
                  <span className="ml-1 text-sm">{company.rating.toFixed(1)}</span>
                </>
              ) : (
                <span>Not rated</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/crm/companies/${company.id}`}>View</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/crm/companies/${company.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompanyTypeBadge({ type }) {
  const typeStyles = {
    CONTRACTOR: "bg-green-100 text-green-800",
    VENDOR: "bg-blue-100 text-blue-800",
    PARTNER: "bg-purple-100 text-purple-800",
    CONSULTANT: "bg-indigo-100 text-indigo-800",
    REGULATORY: "bg-orange-100 text-orange-800",
    SUBCONTRACTOR: "bg-teal-100 text-teal-800",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeStyles[type] || "bg-gray-100 text-gray-800"}`}
    >
      {type}
    </span>
  )
}
