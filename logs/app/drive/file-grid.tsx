"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Folder,
  File,
  MoreVertical,
  Trash2,
  Download,
  Share2,
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FilePenLine,
  FileSpreadsheet,
  FileCode,
  Edit,
  Check,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteFile, deleteFolder, updateFolder, updateFile, updateFolder2, updateFileName } from "../actions/drive-actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface FileGridProps {
  folders: any[]
  files: any[]
  isLoading: boolean
  onFileSelect: (file: any) => void
  onRefresh: () => Promise<void>
  parentFolderId: number | null

}

export function FileGrid({ folders, files, isLoading, onFileSelect, onRefresh, parentFolderId }: FileGridProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFolders, setFilteredFolders] = useState(folders)
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null)
  const [isRootDragOver, setIsRootDragOver] = useState(false)
  const [editingFileId, setEditingFileId] = useState<number | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([])
  type Box = { startX: number; startY: number; currentX: number; currentY: number }

  const [selectBox, setSelectBox] = useState<Box | null>(null)
  const [isDraggingSelect, setIsDraggingSelect] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSelect || !selectBox) return
      setSelectBox((prev) =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
      )
    }
  
    const handleMouseUp = () => {
      if (!isDraggingSelect || !selectBox || !containerRef.current) return
  
      const containerRect = containerRef.current.getBoundingClientRect()
      const x1 = Math.min(selectBox.startX, selectBox.currentX) - containerRect.left
      const x2 = Math.max(selectBox.startX, selectBox.currentX) - containerRect.left
      const y1 = Math.min(selectBox.startY, selectBox.currentY) - containerRect.top
      const y2 = Math.max(selectBox.startY, selectBox.currentY) - containerRect.top
  
      const selected: number[] = []
      files.forEach((file) => {
        const el = document.getElementById(`file-${file.id}`)
        if (!el) return
        const r = el.getBoundingClientRect()
        const left = r.left - containerRect.left
        const right = r.right - containerRect.left
        const top = r.top - containerRect.top
        const bottom = r.bottom - containerRect.top
  
        const intersects =
          !(right < x1 || left > x2 || bottom < y1 || top > y2)
  
        if (intersects) selected.push(file.id)
      })
  
      setSelectedFileIds(selected)
      setIsDraggingSelect(false)
      setSelectBox(null)
    }
  
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingSelect, selectBox, files])
  
  
  useEffect(() => {
    // Filter folders based on search query
    const filtered = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredFolders(filtered)
  }, [searchQuery, folders])

  const handleDeleteFile = async (id: number) => {
    try {
      setDeletingId(id)
      await deleteFile(id)
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "file_deleted", id, name }),
        headers: { "Content-Type": "application/json" }
      })
      
      toast.success("File deleted successfully")
      onRefresh()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteFolder = async (id: number) => {
    try {
      setDeletingId(id)
      await deleteFolder(id)
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "folder_deleted", id, name }),
        headers: { "Content-Type": "application/json" }
      })
      toast.success("Folder deleted successfully")
      onRefresh()
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast.error("Failed to delete folder")
    } finally {
      setDeletingId(null)
    }
  }

  const handleRenameFolder = async (id: number, newName: string) => {
    try {
      await updateFolder(id, newName)
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "name_updated", id, name }),
        headers: { "Content-Type": "application/json" }
      })      
      toast.success("Folder renamed successfully")
      setEditingId(null)
      onRefresh()
    } catch (error) {
      toast.error("Failed to rename folder")
      console.error("Error renaming folder:", error)
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, fileId: number) => {
    e.dataTransfer.setData("fileId", fileId.toString())
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, folderId: number) => {
    e.preventDefault()
    setDragOverFolderId(folderId)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverFolderId(null)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, destinationFolderId: number | null) => {
    e.preventDefault()
    setDragOverFolderId(null)
  
    const fileId = e.dataTransfer.getData("fileId")
    const folderIdToMove = e.dataTransfer.getData("folderId")
  
    if (fileId) {
      try {
        await updateFile(Number(fileId), { folderId: destinationFolderId })
        toast.success("File moved successfully")
        await fetch("/api/drive-events", {
          method: "POST",
          body: JSON.stringify({ type: "file_moved", fileId, folderId: destinationFolderId }),
          headers: { "Content-Type": "application/json" }
        })
        onRefresh()
      } catch (error) {
        toast.error("Failed to move file")
      }
    }
  
    if (folderIdToMove) {
      if (Number(folderIdToMove) === destinationFolderId) {
        toast.error("Cannot move a folder into itself")
        return
      }
  
      try {
        await updateFolder2(Number(folderIdToMove), { parentId: destinationFolderId })
        toast.success("Folder moved successfully")
        await fetch("/api/drive-events", {
          method: "POST",
          body: JSON.stringify({ type: "folder_moved", folderId: folderIdToMove, parentId: destinationFolderId }),
          headers: { "Content-Type": "application/json" }
        })
        onRefresh()
      } catch (error) {
        toast.error("Failed to move folder")
      }
    }
  }
  
  const handleRenameFile = async (fileId: number, newName: string) => {
    try {
      await updateFileName(fileId, newName)
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "name_updated", fileId, newName }),
        headers: { "Content-Type": "application/json" }
      })    
      toast.success("File renamed successfully")
      setEditingFileId(null)
      onRefresh()
    } catch (error) {
      toast.error("Failed to rename file")
      console.error("Error renaming file:", error)
    }
  }
  const handleMassDelete = async () => {
    if (selectedFileIds.length === 0) return
    const confirmed = confirm(`Delete ${selectedFileIds.length} file(s)? This cannot be undone.`)
    if (!confirmed) return
  
    try {
      for (const id of selectedFileIds) {
        await deleteFile(id)
      }
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "files_deleted", File }),
        headers: { "Content-Type": "application/json" }
      })  
      toast.success("Files deleted")
      setSelectedFileIds([])
      onRefresh()
    } catch (e) {
      toast.error("Failed to delete some files")
    }
  }
  
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-10 w-10 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <FileImage className="h-10 w-10 text-purple-500" />
      case "zip":
      case "rar":
      case "7z":
        return <FileArchive className="h-10 w-10 text-yellow-500" />
      case "mp3":
      case "wav":
      case "ogg":
        return <FileAudio className="h-10 w-10 text-blue-500" />
      case "mp4":
      case "avi":
      case "mov":
      case "webm":
        return <FileVideo className="h-10 w-10 text-pink-500" />
      case "doc":
      case "docx":
        return <FilePenLine className="h-10 w-10 text-blue-600" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className="h-10 w-10 text-green-600" />
      case "js":
      case "ts":
      case "html":
      case "css":
      case "json":
      case "xml":
        return <FileCode className="h-10 w-10 text-gray-600" />
      default:
        return <File className="h-10 w-10 text-gray-500" />
    }
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (filteredFolders.length === 0 && files.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        type="search"
        placeholder="Search folders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
<div
  ref={containerRef}
  onMouseDown={(e) => {
    if (e.button !== 0) return // only left click
    setIsDraggingSelect(true)
    setSelectBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    })
  }}
  className="relative select-none"
>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  <div
  onDragOver={(e) => {
    e.preventDefault()
    setIsRootDragOver(true)
  }}
  onDragLeave={() => setIsRootDragOver(false)}
  onDrop={(e) => {
    handleDrop(e, parentFolderId)
    setIsRootDragOver(false)
  }}
  className={isRootDragOver ? "ring-2 ring-green-500 rounded-md p-2 text-center text-center" : "border rounded-lg p-4 transition-colors flex flex-col text-center"}
>Drag to home</div>
<div
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleMassDelete}
  className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg"
>
  Drop to Delete
</div>

        {filteredFolders.map((folder) => (
            <div
  key={folder.id}
  draggable
  onDragStart={(e) => e.dataTransfer.setData("folderId", folder.id.toString())}
  className={`border rounded-lg p-4 transition-colors flex flex-col ${
    dragOverFolderId === folder.id ? "border-green-500 bg-green-50" : "hover:border-primary"
  }`}
  onDragOver={handleDragOver}
  onDragEnter={(e) => handleDragEnter(e, folder.id)}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, folder.id)}
>

            <div className="flex items-start justify-between">
              {editingId === folder.id ? (
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameFolder(folder.id, newFolderName)
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => setEditingId(null)}
                    className="text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      handleRenameFolder(folder.id, newFolderName)
                      setEditingId(null)
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link href={`/drive?folder=${folder.id}`} className="flex items-center space-x-2 flex-1 min-w-0">
                  <Folder className="h-10 w-10 text-blue-500 flex-shrink-0" />
                  <span className="font-medium truncate">{folder.name}</span>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {editingId === folder.id ? null : (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(folder.id)
                        setNewFolderName(folder.name)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDeleteFolder(folder.id)}
                    disabled={deletingId === folder.id}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Folder</div>
          </div>
        ))}

        {files.map((file) => (
          <div
            id={`file-${file.id}`}
            key={file.id}
            className={`border rounded-lg p-4 transition-colors flex flex-col ${
                selectedFileIds.includes(file.id) ? "border-blue-500 bg-blue-50" : "hover:border-primary"
              }`}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, file.id)}
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() => onFileSelect(file)}
                className="flex items-center space-x-2 flex-1 min-w-0 text-left"
              >
                {getFileIcon(file.type)}
                {editingFileId === file.id ? (
  <div className="flex items-center space-x-2 flex-1 min-w-0">
    <Input
      type="text"
      value={newFileName}
      onChange={(e) => setNewFileName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleRenameFile(file.id, newFileName)
        }
      }}
      onBlur={() => setEditingFileId(null)}
      className="text-sm"
    />
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleRenameFile(file.id, newFileName)}
    >
      <Check className="h-4 w-4" />
    </Button>
  </div>
) : (
  <span className="font-medium truncate">{file.name}</span>
)}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFileSelect(file)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
  onClick={() => {
    setEditingFileId(file.id)
    setNewFileName(file.name)
  }}
>
  <Edit className="h-4 w-4 mr-2" />
  Rename
</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={deletingId === file.id}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {formatFileSize(file.size)} • {file.owner.username}
            </div>
          </div>
        ))}
      </div>
      </div>
      {selectBox && (
  <div
    className="absolute border border-blue-500 bg-blue-200/30 z-50 pointer-events-none"
    style={{
      left: Math.min(selectBox.startX, selectBox.currentX) - containerRef.current?.getBoundingClientRect().left!,
      top: Math.min(selectBox.startY, selectBox.currentY) - containerRef.current?.getBoundingClientRect().top!,
      width: Math.abs(selectBox.currentX - selectBox.startX),
      height: Math.abs(selectBox.currentY - selectBox.startY),
    }}
  />
)}



    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

