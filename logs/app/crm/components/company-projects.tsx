import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"

export default function CompanyProjects({ company }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Projects involving {company.name}</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/crm/projects/new?companyId=${company.id}`}>Add to Project</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {company.projects && company.projects.length > 0 ? (
          <div className="border rounded-md">
            <div className="grid grid-cols-6 p-4 font-medium border-b">
              <div>Project Name</div>
              <div>Role</div>
              <div>Contract Value</div>
              <div>Start Date</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y">
              {company.projects.map((link) => (
                <div key={link.id} className="grid grid-cols-6 p-4 hover:bg-muted/50">
                  <div className="font-medium">
                    <Link href={`/crm/projects/${link.project.id}`} className="hover:underline">
                      {link.project.name}
                    </Link>
                  </div>
                  <div>{link.role}</div>
                  <div>{formatCurrency(link.contractValue)}</div>
                  <div>{formatDate(link.startDate)}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        link.project.status === "PLANNING"
                          ? "bg-purple-100 text-purple-800"
                          : link.project.status === "BIDDING"
                            ? "bg-blue-100 text-blue-800"
                            : link.project.status === "DESIGN"
                              ? "bg-indigo-100 text-indigo-800"
                              : link.project.status === "PERMITTING"
                                ? "bg-cyan-100 text-cyan-800"
                                : link.project.status === "CONSTRUCTION"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : link.project.status === "INSPECTION"
                                    ? "bg-orange-100 text-orange-800"
                                    : link.project.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800"
                                      : link.project.status === "ON_HOLD"
                                        ? "bg-gray-100 text-gray-800"
                                        : link.project.status === "CANCELLED"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {link.project.status || "UNKNOWN"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/crm/projects/${link.project.id}`}>View Project</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No projects found for this company</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
