// app/upload/page.tsx (Next.js 13+ App Router)
"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { Button } from "@/components/ui/button"

export default function PDFUploadPage() {
  const [text, setText] = useState<string>("")

  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    let fullText = ""

    const pages = pdfDoc.getPages()
    for (const page of pages) {
      const { textContent } = await page.getTextContent()
      fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
    }

    setText(fullText.trim())
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      await extractTextFromPDF(file)
    } else {
      alert("Please upload a valid PDF file.")
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">PDF Text Extractor</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <div className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded max-h-[400px] overflow-y-auto">
        {text || "Text will appear here after upload."}
      </div>
    </div>
  )
}
