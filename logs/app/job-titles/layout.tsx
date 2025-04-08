import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Job Titles Management",
  description: "Import and manage job titles from HTML files",
}

export default function JobTitlesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Job Titles Management</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
