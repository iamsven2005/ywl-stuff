import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { CommandMatchAlert } from "@/components/command-match-alert"
import { AlertMonitorWrapper } from "@/components/alert-monitor-wrapper"
import { getCurrentUser } from "./login/actions"
import Navbar from "@/components/navbar"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const user = await getCurrentUser()
  const userid = user?.id
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">

          {user?.role.includes("admin")&& (
            <CommandMatchAlert matches={[]} />

          )}
            <AlertMonitorWrapper />
          </div>
          {userid && (
          <Navbar id={userid}/>
          )}

          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

