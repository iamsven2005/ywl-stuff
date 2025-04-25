"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function WorkflowStepsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Workflow Steps</CardTitle>
            <div className="w-full max-w-sm h-9 bg-muted rounded-md animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-md p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-muted rounded-md animate-pulse"></div>
                      <div>
                        <div className="h-5 w-40 bg-muted rounded-md animate-pulse mb-2"></div>
                        <div className="h-4 w-60 bg-muted rounded-md animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-muted rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-muted rounded-md animate-pulse"></div>
              <div className="h-20 w-full bg-muted rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
