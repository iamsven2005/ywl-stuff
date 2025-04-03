"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Cookie } from "lucide-react"

export function CookieDisplay() {
  const [open, setOpen] = useState(false)

  // Define the cookies from the image
  const cookies = [
    { name: "__doSubmit_unique_flag", value: "", domain: "192.168.1.71", path: "/" },
    {
        name: "comenufg_TREE",
        value: "1.7.8.16.27.28.33.34.46.54.66.77.78.82.83.87",
        domain: "192.168.1.71",
        path: "/wcapi",
      },
      {
        name: "comenufg_TREE",
        value: "1.7.8.16.27.28.33.34.46.54.66.77.78.82.83.87",
        domain: "192.168.1.71",
        path: "/wc1",
      },
      { name: "PYLUSER_SELECTED_MENU_ID", value: "612", domain: "192.168.1.71", path: "/" },

    { name: "JSESSIONID", value: "AE015E6DD66C14778B798149FD1C6A38", domain: "192.168.1.71", path: "/" },
    { name: "__SYS_SUPPORT_SESSION__", value: "session", domain: "192.168.1.71", path: "/" },
    {
        name: "csrftoken",
        value: "tUY4T36IIeBEKiSbinWbfd5FW1uF5fYyQmKwwdXqdKjcw9KKiSuxJCWdtw8TG",
        domain: "192.168.1.71",
        path: "/",
      },
    { name: "PYLUSER_SELECTED_MENU_ACTION", value: "wc1%2Fmenu%3Fid%3D612", domain: "192.168.1.71", path: "/" },
,

    { name: "sessionid", value: "wzi2aycfiqeu4jeveh8k8k3mopu840mf", domain: "192.168.1.71", path: "/"},
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Cookie className="h-4 w-4 mr-2" />
          View Cookies
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Cookies Being Set</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((cookie, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{cookie.name}</TableCell>
                <TableCell className="font-mono text-xs break-all">{cookie.value}</TableCell>
                <TableCell>{cookie.domain}</TableCell>
                <TableCell>{cookie.path}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}

