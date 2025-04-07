"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { deleteFile, deleteFolder, updateFolder, updateFile } from "../actions/drive-actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface FileGridProps {
  folders: any[]
  files: any[]
  isLoading: boolean
  onFileSelect: (file: any) => void
  onRefresh: () => Promise<void>
}

export function FileGrid({ folders, files, isLoading, onFileSelect, onRefresh }: FileGridProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFolders, setFilteredFolders] = useState(folders)
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null)

  useEffect(() => {
    // Filter folders based on search query
    const filtered = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredFolders(filtered)
  }, [searchQuery, folders])

  const handleDeleteFile = async (id: number) => {
    try {
      setDeletingId(id)
      await deleteFile(id)
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
      toast.success("Folder renamed successfully")
      setEditingId(null)
      onRefresh()
    } catch (error) {
      console.error("Error renaming folder:", error)
      toast.error("Failed to rename folder")
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, folderId: number) => {
    e.preventDefault()
    setDragOverFolderId(null)

    const fileId = e.dataTransfer.getData("fileId")
    if (fileId) {
      try {
        await updateFile(Number(fileId), { folderId })
        toast.success("File moved successfully")
        onRefresh()
      } catch (error) {
        console.error("Error moving file:", error)
        toast.error("Failed to move file")
      }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
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
            key={file.id}
            className="border rounded-lg p-4 hover:border-primary transition-colors flex flex-col"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, file.id)}
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() => onFileSelect(file)}
                className="flex items-center space-x-2 flex-1 min-w-0 text-left"
              >
                {getFileIcon(file.type)}
                <span className="font-medium truncate">{file.name}</span>
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
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

