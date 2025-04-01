import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { CommandMatchAlert } from "@/components/command-match-alert"
import { AlertMonitorWrapper } from "@/components/alert-monitor-wrapper"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "./theme-toggle"
import { checkUserPermission } from "./actions/permission-actions"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
            <CommandMatchAlert matches={[]} />
            <AlertMonitorWrapper />
          </div>
          <UserNav/>
          <ThemeToggle />

          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

