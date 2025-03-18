"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bell, BarChart2, AlertTriangle, Shield, Users, FileText, Settings, Mail, Database } from "lucide-react"

interface AdminNavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function AdminNavbar() {
  const pathname = usePathname()

  const navItems: AdminNavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      title: "System Logs",
      href: "/logs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Auth Logs",
      href: "/auth-logs",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "Command Matches",
      href: "/command-matches",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: "Email Templates",
      href: "/email-templates",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "Backup",
      href: "/backup",
      icon: <Database className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Admin Dashboard</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
        </div>
      </div>
    </div>
  )
}

