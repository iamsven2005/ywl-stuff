"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, RefreshCw, ExternalLink, Save, Cookie } from "lucide-react"
import { updatePageNotes } from "../actions/page-actions"
import { toast } from "sonner"

interface IframePreviewProps {
  pageId: number
  baseUrl: string
  notes: string | null
  onRefresh: () => void
}

export function IframePreview({ pageId, baseUrl, notes, onRefresh }: IframePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentNotes, setCurrentNotes] = useState(notes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [cookiesSet, setCookiesSet] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const fullUrl = `${baseUrl}?id=${pageId}`

  const handleIframeLoad = () => {
    setIsLoading(false)
    // Set cookies when iframe loads
    if (iframeRef.current && !cookiesSet) {
      setCookies()
    }
  }

  const setCookies = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return

    // Define the cookies from the image
    const cookies = [
      { name: "JSESSIONID", value: "AE0156DD66C14778B798149FD1C6A38" },
      { name: "PYLUSER_SELECTED_MENU_ACTION", value: "wc1%2Fmenu%3Fid%3D612" },
      { name: "PYLUSER_SELECTED_MENU_ID", value: "612" },
      { name: "__SYS_SUPPORT_SESSION__", value: "session" },
      { name: "__doSubmit_unique_flag", value: "" },
      { name: "comenufg_TREE", value: "1.7.8.16.27.28.33.34.46.54.66.77.78.82.83.87" },
      { name: "comenufg_TREE", value: "1.7.8.16.27.28.33.34.46.54.66.77.78.82.83.87" },
      { name: "csrftoken", value: "tUY4T36IIeBEKiSbinWbfd5FW1uF5fYyQmKwwdXqdKjcw9KKiSuxJCWdtw8TG" },
      { name: "sessionid", value: "wzi2aycfiqeu4jeveh8k8k3mopu840mf" },
    ]

    // Send message to iframe to set cookies
    iframeRef.current.contentWindow.postMessage(
      {
        type: "setCookies",
        cookies: cookies,
      },
      "*",
    )

    toast.success("Cookies have been set to the iframe")
    setCookiesSet(true)
  }

  const refreshIframe = () => {
    setIsLoading(true)
    setCookiesSet(false)
    if (iframeRef.current) {
      iframeRef.current.src = fullUrl
    }
    onRefresh()
  }

  const openInNewTab = () => {
    window.open(fullUrl, "_blank")
  }

  const saveNotes = async () => {
    setIsSaving(true)
    try {
      const result = await updatePageNotes(pageId, currentNotes)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Notes saved successfully")
      }
    } catch (error) {
      toast.error("Failed to save notes")
    } finally {
      setIsSaving(false)
    }
  }

  // Reset notes when pageId changes
  useEffect(() => {
    setCurrentNotes(notes || "")
    setIsLoading(true)
    setCookiesSet(false)
  }, [pageId, notes])

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Page #{pageId}</h2>
          <p className="text-sm text-gray-500 truncate">{fullUrl}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={setCookies} disabled={!iframeRef.current || cookiesSet}>
            <Cookie className="h-4 w-4 mr-2" />
            Set Cookies
          </Button>
          <Button variant="outline" size="sm" onClick={refreshIframe} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={openInNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={fullUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          title={`Page ${pageId}`}
        />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Notes</h3>
          <Button size="sm" onClick={saveNotes} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Notes
          </Button>
        </div>
        <Textarea
          value={currentNotes}
          onChange={(e) => setCurrentNotes(e.target.value)}
          placeholder="Add notes about this page..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}

