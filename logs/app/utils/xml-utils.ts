interface MessageData {
    id?: number
    content: string
    senderId: number
    senderName: string
    senderEmail?: string
    receiverId?: number
    receiverName?: string
    receiverEmail?: string
    groupId: number
    createdAt: Date
    edited?: boolean
    fileAttachment?: string | null
    fileOriginalName?: string | null
    fileType?: string | null
  }
  
  export interface XMLMessage {
    to: string
    from: string
    body: string
    date: string
  }
  
  export interface XMLTranscript {
    messages: XMLMessage[]
  }
  
  // Parse XML string to transcript object
  export function parseXMLTranscript(xmlString: string): XMLTranscript {
    try {
      // Create a DOM parser
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, "text/xml")
  
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror")
      if (parserError) {
        throw new Error("XML parsing error: " + parserError.textContent)
      }
  
      // Extract messages
      const messages: XMLMessage[] = []
      const messageElements = xmlDoc.querySelectorAll("message")
  
      messageElements.forEach((messageEl) => {
        const to = messageEl.querySelector("to")?.textContent || ""
        const from = messageEl.querySelector("from")?.textContent || ""
        const body = messageEl.querySelector("body")?.textContent || ""
        const date = messageEl.querySelector("date")?.textContent || ""
  
        messages.push({ to, from, body, date })
      })
  
      return { messages }
    } catch (error) {
      console.error("Error parsing XML:", error)
      throw error
    }
  }
  
  // Parse date string from XML to JavaScript Date
  export function parseXMLDate(dateString: string): Date {
    try {
      // Handle common timezone abbreviations
      const timezoneMap: Record<string, string> = {
        SGT: "+08:00",
        EST: "-05:00",
        EDT: "-04:00",
        CST: "-06:00",
        CDT: "-05:00",
        MST: "-07:00",
        MDT: "-06:00",
        PST: "-08:00",
        PDT: "-07:00",
        GMT: "+00:00",
        UTC: "+00:00",
      }
  
      // Extract timezone abbreviation if present
      const tzMatch = dateString.match(/\s([A-Z]{3,4})$/)
      let parsedDate: Date
  
      if (tzMatch && tzMatch[1] in timezoneMap) {
        // Replace timezone abbreviation with offset
        const tz = tzMatch[1]
        const offset = timezoneMap[tz]
        const newDateString = dateString.replace(tz, offset)
        parsedDate = new Date(newDateString)
      } else {
        // Try parsing directly
        parsedDate = new Date(dateString)
      }
  
      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        // Fallback: try parsing without timezone
        const basicDate = dateString.split(" ")[0]
        const basicTime = dateString.split(" ")[1]?.split(".")[0]
        if (basicDate && basicTime) {
          parsedDate = new Date(`${basicDate}T${basicTime}`)
        }
      }
  
      // If still invalid, use current date
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Could not parse date: ${dateString}, using current date instead`)
        parsedDate = new Date()
      }
  
      return parsedDate
    } catch (error) {
      console.error(`Error parsing date: ${dateString}`, error)
      return new Date() // Fallback to current date
    }
  }
  
  // Convert messages to XML format
  export function generateXMLTranscript(messages: MessageData[]): string {
    try {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<transcript>\n <messages>\n'
  
      messages.forEach((message) => {
        const receiverEmail = message.receiverEmail || "group@chat.internal"
        const senderEmail = message.senderEmail || message.senderName + "@system.internal"
  
        xml += "  <message>\n"
        xml += `   <to>${receiverEmail}</to>\n`
        xml += `   <from>${senderEmail}</from>\n`
        xml += `   <body>${escapeXML(message.content)}</body>\n`
        xml += `   <date>${formatDate(message.createdAt)}</date>\n`
        xml += "  </message>\n"
      })
  
      xml += " </messages>\n</transcript>"
      return xml
    } catch (error) {
      console.error("Error generating XML:", error)
      throw error
    }
  }
  
  // Helper function to escape XML special characters
  function escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }
  
  // Format date to match the expected format
  function formatDate(date: Date): string {
    const d = new Date(date)
  
    // Get timezone abbreviation
    const timeZoneAbbr = d.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop() || "UTC"
  
    // Format: YYYY-MM-DD HH:MM:SS.mmm TZ
    return (
      `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())} ` +
      `${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}.` +
      `${padZeroMs(d.getMilliseconds())} ${timeZoneAbbr}`
    )
  }
  
  function padZero(num: number): string {
    return num.toString().padStart(2, "0")
  }
  
  function padZeroMs(num: number): string {
    return num.toString().padStart(3, "0")
  }
  
  // Download XML as a file
  export function downloadXML(xml: string, filename: string): void {
    const blob = new Blob([xml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  