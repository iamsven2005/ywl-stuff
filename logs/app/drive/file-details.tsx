"use client"

import { useState, useEffect } from "react"
import { X, Download, Share2, Clock, User, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFileDetails, getUsersForSharing, shareFile, removeFilePermission } from "../actions/drive-actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface FileDetailsProps {
  file: any
  onClose: () => void
  onUpdate: () => Promise<void>
}

export function FileDetails({ file: initialFile, onClose, onUpdate }: FileDetailsProps) {
  const [file, setFile] = useState<any>(initialFile)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedPermission, setSelectedPermission] = useState<string>("read")
  const [isSharing, setIsSharing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [fileDetails, usersData] = await Promise.all([getFileDetails(initialFile.id), getUsersForSharing()])
        setFile(fileDetails)
        setUsers(usersData)
      } catch (error) {
        console.error("Error loading file details:", error)
        toast.error("Failed to load file details")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [initialFile.id])

  const handleShare = async () => {
    if (!selectedUser) {
      toast.error("Please select a user")
      return
    }

    setIsSharing(true)

    try {
      await shareFile(file.id, Number.parseInt(selectedUser), selectedPermission)
      toast.success("File shared successfully")

      // Refresh file details
      const fileDetails = await getFileDetails(file.id)
      setFile(fileDetails)

      // Reset selection
      setSelectedUser("")

      // Refresh parent component
      await onUpdate()
    } catch (error) {
      toast.error("Failed to share file")
      console.error(error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleRemovePermission = async (userId: number) => {
    try {
      await removeFilePermission(file.id, userId)
      toast.success("Permission removed")

      // Refresh file details
      const fileDetails = await getFileDetails(file.id)
      setFile(fileDetails)

      // Refresh parent component
      await onUpdate()
    } catch (error) {
      toast.error("Failed to remove permission")
      console.error(error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getFilePreview = () => {
    const fileType = file.type.toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "svg"].includes(fileType)) {
      return (
        <div className="flex justify-center mb-4">
          <img
            src={file.url || "/placeholder.svg"}
            alt={file.name}
            className="max-w-full max-h-48 object-contain rounded-md"
          />
        </div>
      )
    }

    if (["mp4", "webm", "ogg"].includes(fileType)) {
      return (
        <div className="flex justify-center mb-4">
          <video src={file.url} controls className="max-w-full max-h-48 rounded-md">
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (["mp3", "wav"].includes(fileType)) {
      return (
        <div className="flex justify-center mb-4">
          <audio src={file.url} controls className="w-full">
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    return (
      <div className="flex justify-center items-center mb-4 bg-muted/30 h-48 rounded-md">
        <FileText className="h-16 w-16 text-muted-foreground" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Loading...</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold truncate">{file.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {getFilePreview()}

      <div className="space-y-2 mb-4">
        <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="secondary" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </a>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Owner: {file.owner.username}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Created: {formatDate(file.createdAt)}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Modified: {formatDate(file.updatedAt)}</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex-1 overflow-auto">
        <h4 className="font-medium mb-2">Share with others</h4>

        <div className="flex space-x-2 mb-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPermission} onValueChange={setSelectedPermission}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="write">Write</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleShare} disabled={isSharing || !selectedUser}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <h4 className="font-medium mb-2">People with access</h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{file.owner.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{file.owner.username}</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>

          {file.permissions.map((permission: any) => (
            <div key={permission.id} className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>{permission.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{permission.user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{permission.access}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRemovePermission(permission.userId)}>
                Remove
              </Button>
            </div>
          ))}

          {file.permissions.length === 0 && <p className="text-sm text-muted-foreground py-2">No shared access</p>}
        </div>
      </div>
    </div>
  )
}

