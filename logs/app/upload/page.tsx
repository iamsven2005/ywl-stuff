"use client";

import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

export default function FileTextExtractor() {
  const [extractedText, setExtractedText] = useState("");

  useEffect(() => {
    // Use local MJS worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(" ") + "\n";
        }

        setExtractedText(text);
      };
      reader.readAsArrayBuffer(file);
    } else if (
      fileType === "text/plain" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv")
    ) {
      const reader = new FileReader();
      reader.onload = () => {
        setExtractedText(reader.result as string);
      };
      reader.readAsText(file);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const reader = new FileReader();
      reader.onload = async function () {
        const arrayBuffer = this.result as ArrayBuffer;
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setExtractedText(value);
      };
      reader.readAsArrayBuffer(file);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx")
    ) {
      const reader = new FileReader();
      reader.onload = function () {
        const data = new Uint8Array(this.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        let text = "";

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          text += `Sheet: ${sheetName}\n${csv}\n\n`;
        });

        setExtractedText(text);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file type. Please upload PDF, TXT, CSV, DOCX, or XLSX.");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <input
        type="file"
        accept=".pdf,.txt,.csv,.docx,.xlsx"
        onChange={handleFileChange}
        className="block"
      />
      <textarea
        className="w-full h-80 border rounded p-2 font-mono text-sm"
        readOnly
        value={extractedText}
        placeholder="Extracted text will appear here..."
      />
    </div>
  );
}
