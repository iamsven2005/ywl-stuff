"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getFolderContents, getFolderPath } from "../actions/drive-actions"
import { FolderBreadcrumb } from "./folder-breadcrumb"
import { FileGrid } from "./file-grid"
import { UploadButton } from "./upload-button"
import { CreateFolderButton } from "./create-folder-button"
import { FileDetails } from "./file-details"

export function DriveExplorer() {
  const searchParams = useSearchParams()
  const folderIdParam = searchParams.get("folder")
  const folderId = folderIdParam ? Number.parseInt(folderIdParam) : null

  const [folders, setFolders] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [path, setPath] = useState<any[]>([{ id: null, name: "My Drive" }])
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFolderContents() {
      setIsLoading(true)
      try {
        const { folders, files } = await getFolderContents(folderId)
        const pathData = await getFolderPath(folderId)

        setFolders(folders)
        setFiles(files)
        setPath(pathData)
      } catch (error) {
        console.error("Error loading folder contents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFolderContents()
  }, [folderId])

  const handleFileSelect = (file: any) => {
    setSelectedFile(file)
  }

  const handleCloseDetails = () => {
    setSelectedFile(null)
  }

  const handleRefresh = async () => {
    const { folders, files } = await getFolderContents(folderId)
    setFolders(folders)
    setFiles(files)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <UploadButton folderId={folderId} onUploadComplete={handleRefresh} />
        <CreateFolderButton parentId={folderId} onFolderCreated={handleRefresh} />
      </div>

      <FolderBreadcrumb path={path} />

      <div className="flex flex-1 mt-4">
        <div className={`flex-1 transition-all ${selectedFile ? "pr-4 lg:pr-80" : ""}`}>
          <FileGrid
            folders={folders}
            files={files}
            isLoading={isLoading}
            onFileSelect={handleFileSelect}
            onRefresh={handleRefresh}
          />
        </div>

        {selectedFile && (
          <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-background border-l z-30 overflow-auto p-4 shadow-lg transition-transform transform-gpu">
            <FileDetails file={selectedFile} onClose={handleCloseDetails} onUpdate={handleRefresh} />
          </div>
        )}
      </div>
    </div>
  )
}

