"use server"

import { db, db2 } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { logActivity } from "@/lib/activity-logger"
import fs from "fs/promises"
// Get folders and files for a specific folder
export async function getFolderContents(folderId: number | null = null) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to access drive")
    }

    const userId = Number(session.user.id)

    // Get folders
    const folders = await db.driveFolder.findMany({
      where: {
        parentId: folderId,
        ownerId: userId,
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get files
    const files = await db.driveFile.findMany({
      where: {
        folderId: folderId,
        OR: [
          { ownerId: userId },
          {
            permissions: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        permissions: true,
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    })

    return { folders, files }
  } catch (error) {
    console.error("Error fetching folder contents:", error)
    throw new Error("Failed to fetch folder contents")
  }
}
export async function updateFolder2(id: number, data: { name?: string; parentId?: number }) {
  return db.driveFolder.update({
    where: { id },
    data
  })
}

// Get folder breadcrumb path
export async function getFolderPath(folderId: number | null) {
  try {
    if (!folderId) {
      return [{ id: null, name: "My Drive" }]
    }

    const path = []
    let currentFolder = await db.driveFolder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    })

    if (!currentFolder) {
      return [{ id: null, name: "My Drive" }]
    }

    // Add current folder
    path.unshift({ id: currentFolder.id, name: currentFolder.name })

    // Add parent folders
    while (currentFolder?.parent) {
      currentFolder = currentFolder.parent
      path.unshift({ id: currentFolder.id, name: currentFolder.name })
    }

    // Add root
    path.unshift({ id: null, name: "My Drive" })

    return path
  } catch (error) {
    console.error("Error fetching folder path:", error)
    throw new Error("Failed to fetch folder path")
  }
}

// Create a new folder
export async function createFolder(name: string, parentId: number | null = null) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to create folders")
    }

    const userId = Number(session.user.id)
    const baseId = userId + 100000

    // Find the latest folder ID created by this user in the custom range
    const latestFolder = await db.driveFolder.findFirst({
      where: {
        ownerId: userId,
        id: {
          gte: baseId,
          lt: baseId + 100000, // max range to avoid collisions with other users
        },
      },
      orderBy: {
        id: "desc",
      },
    })

    const newId = latestFolder ? latestFolder.id + 1 : baseId

    const folder = await db.driveFolder.create({
      data: {
        id: newId,
        name,
        parentId,
        ownerId: userId,
      },
    })

    await logActivity({
      actionType: "Created Folder",
      targetType: "DriveFolder",
      targetId: folder.id,
      details: `Created folder: ${name}`,
    })

    revalidatePath("/drive")
    return folder
  } catch (error) {
    console.error("Error creating folder:", error)
    throw new Error("Failed to create folder")
  }
}


// Upload a file
export async function uploadFile(formData: FormData) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to upload files")
    }

    const userId = Number(session.user.id)
    const file = formData.get("file") as File
    let folderId = Number(formData.get("folderId") as string) || userId

    if (!file) {
      throw new Error("No file provided")
    }

    // Check if folderId is a valid number
    if (isNaN(folderId)) {
      folderId = 1 // Default to root folder if folderId is invalid
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "drive")
    await mkdir(uploadsDir, { recursive: true })

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || ""
    const uniqueFilename = `${timestamp}-${userId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(uploadsDir, uniqueFilename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Determine file type from extension
// Determine file type from extension
const fileType = fileExtension.toLowerCase()

// Handle duplicate filenames
let baseName = file.name.replace(/\.[^/.]+$/, "")
let extension = fileExtension ? `.${fileExtension}` : ""
let finalName = file.name
let counter = 1

while (await db.driveFile.findFirst({
  where: {
    name: finalName,
    ownerId: userId,
    folderId: folderId
  }
})) {
  finalName = `${baseName} (copy${counter > 1 ? ` ${counter}` : ""})${extension}`
  counter++
}

// Create file record in database
const fileRecord = await db.driveFile.create({
  data: {
    name: finalName,
    type: fileType,
    size: file.size,
    folderId: folderId,
    ownerId: userId,
    url: `/api/drive/file/${uniqueFilename}`,
  },
})


    await logActivity({
      actionType: "Uploaded File",
      targetType: "DriveFile",
      targetId: fileRecord.id,
      details: `Uploaded file: ${file.name}`,
    })

    revalidatePath("/drive")
    return fileRecord
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload file")
  }
}

// Delete a file
export async function deleteFile(fileId: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to delete files")
    }

    const userId = Number(session.user.id)

    // Get the file to check ownership
    const file = await db.driveFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, name: true, url: true },
    })

    if (!file) {
      throw new Error("File not found")
    }

    if (file.ownerId !== userId) {
      throw new Error("You don't have permission to delete this file")
    }

    // Delete file permissions first
    await db.driveFilePermission.deleteMany({
      where: { fileId },
    })

    // Delete file record
    await db.driveFile.delete({
      where: { id: fileId },
    })

    // Note: In a production app, you would also delete the physical file
    // from storage, but we'll skip that for this example

    await logActivity({
      actionType: "Deleted File",
      targetType: "DriveFile",
      targetId: fileId,
      details: `Deleted file: ${file.name}`,
    })

    revalidatePath("/drive")
    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    throw new Error("Failed to delete file")
  }
}

// Delete a folder
export async function deleteFolder(folderId: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to delete folders")
    }

    const userId = Number(session.user.id)

    // Get the folder to check ownership
    const folder = await db.driveFolder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
        children: true,
      },
    })

    if (!folder) {
      throw new Error("Folder not found")
    }

    if (folder.ownerId !== userId) {
      throw new Error("You don't have permission to delete this folder")
    }

    // Recursively delete all subfolders and their files
    await recursiveDeleteFolder(folderId)

    await logActivity({
      actionType: "Deleted Folder",
      targetType: "DriveFolder",
      targetId: folderId,
      details: `Deleted folder: ${folder.name}`,
    })

    revalidatePath("/drive")
    return { success: true }
  } catch (error) {
    console.error("Error deleting folder:", error)
    throw new Error("Failed to delete folder")
  }
}

// Helper function to recursively delete folders
async function recursiveDeleteFolder(folderId: number) {
  // Get all files in this folder and delete them
  const files = await db.driveFile.findMany({
    where: { folderId },
  })

  for (const file of files) {
    // Delete file permissions
    await db.driveFilePermission.deleteMany({
      where: { fileId: file.id },
    })

    // Delete file
    await db.driveFile.delete({
      where: { id: file.id },
    })
  }

  // Get all subfolders
  const subfolders = await db.driveFolder.findMany({
    where: { parentId: folderId },
  })

  // Recursively delete each subfolder
  for (const subfolder of subfolders) {
    await recursiveDeleteFolder(subfolder.id)
  }

  // Finally delete this folder
  await db.driveFolder.delete({
    where: { id: folderId },
  })
}

// Share a file with another user
export async function shareFile(fileId: number, userId: number, access = "read") {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to share files")
    }

    const granterId = Number(session.user.id)

    // Check if the file exists and the current user is the owner
    const file = await db.driveFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, name: true },
    })

    if (!file) {
      throw new Error("File not found")
    }

    if (file.ownerId !== granterId) {
      throw new Error("Only the file owner can share this file")
    }

    // Check if the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Create or update permission
    const permission = await db.driveFilePermission.upsert({
      where: {
        fileId_userId: {
          fileId,
          userId,
        },
      },
      update: {
        access,
        grantedBy: granterId,
        grantedAt: new Date(),
      },
      create: {
        fileId,
        userId,
        access,
        grantedBy: granterId,
      },
    })

    await logActivity({
      actionType: "Shared File",
      targetType: "DriveFile",
      targetId: fileId,
      details: `Shared file: ${file.name} with user ID: ${userId}`,
    })

    revalidatePath("/drive")
    return permission
  } catch (error) {
    console.error("Error sharing file:", error)
    throw new Error("Failed to share file")
  }
}

// Remove file sharing permission
export async function removeFilePermission(fileId: number, userId: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to manage file permissions")
    }

    const currentUserId = Number(session.user.id)

    // Check if the file exists and the current user is the owner
    const file = await db.driveFile.findUnique({
      where: { id: fileId },
      select: { ownerId: true, name: true },
    })

    if (!file) {
      throw new Error("File not found")
    }

    if (file.ownerId !== currentUserId) {
      throw new Error("Only the file owner can manage permissions")
    }

    // Delete the permission
    await db.driveFilePermission.delete({
      where: {
        fileId_userId: {
          fileId,
          userId,
        },
      },
    })

    await logActivity({
      actionType: "Removed File Permission",
      targetType: "DriveFile",
      targetId: fileId,
      details: `Removed access for user ID: ${userId} from file: ${file.name}`,
    })

    revalidatePath("/drive")
    return { success: true }
  } catch (error) {
    console.error("Error removing file permission:", error)
    throw new Error("Failed to remove file permission")
  }
}

// Get file details with permissions
export async function getFileDetails(fileId: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to view file details")
    }

    const userId = Number(session.user.id)

    const file = await db.driveFile.findUnique({
      where: { id: fileId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        folder: true,
      },
    })

    if (!file) {
      throw new Error("File not found")
    }

    // Check if user has access to this file
    const hasAccess = file.ownerId === userId || file.permissions.some((p) => p.userId === userId)

    if (!hasAccess) {
      throw new Error("You don't have permission to view this file")
    }

    return file
  } catch (error) {
    console.error("Error fetching file details:", error)
    throw new Error("Failed to fetch file details")
  }
}

// Get all users for sharing
export async function getUsersForSharing() {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in")
    }

    const currentUserId = Number(session.user.id)

    const users = await db.user.findMany({
      where: {
        id: { not: currentUserId }, // Exclude current user
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: "asc",
      },
    })

    return users
  } catch (error) {
    console.error("Error fetching users for sharing:", error)
    throw new Error("Failed to fetch users")
  }
}

// Function to update a folder
export async function updateFolder(id: number, name: string) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to update folders")
    }

    const userId = Number(session.user.id)

    // Get the folder to check ownership
    const folder = await db.driveFolder.findUnique({
      where: { id },
    })

    if (!folder) {
      throw new Error("Folder not found")
    }

    if (folder.ownerId !== userId) {
      throw new Error("You don't have permission to update this folder")
    }

    // Update the folder
    const updatedFolder = await db.driveFolder.update({
      where: { id },
      data: {
        name: name,
        updatedAt: new Date(),
      },
    })

    await logActivity({
      actionType: "Updated Folder",
      targetType: "DriveFolder",
      targetId: id,
      details: `Updated folder name to: ${name}`,
    })

    revalidatePath("/drive")
    return updatedFolder
  } catch (error) {
    console.error("Error updating folder:", error)
    throw new Error("Failed to update folder")
  }
}


export async function renameFolder(folderId: number, newName: string) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to rename folders")
    }

    const userId = Number(session.user.id)

    // Get the folder to check ownership
    const folder = await db.driveFolder.findUnique({
      where: { id: folderId },
    })

    if (!folder) {
      throw new Error("Folder not found")
    }

    if (folder.ownerId !== userId) {
      throw new Error("You don't have permission to rename this folder")
    }

    const updatedFolder = await db.driveFolder.update({
      where: { id: folderId },
      data: { name: newName },
    })

    await logActivity({
      actionType: "Renamed Folder",
      targetType: "DriveFolder",
      targetId: folderId,
      details: `Renamed folder from ${folder.name} to ${newName}`,
    })

    revalidatePath("/drive")
    return updatedFolder
  } catch (error) {
    console.error("Error renaming folder:", error)
    throw new Error("Failed to rename folder")
  }
}


export async function updateFile(id: number, data: { folderId: number | null }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to update files")
    }

    const userId = Number(session.user.id)

    // Get the file to check ownership
    const file = await db.driveFile.findUnique({
      where: { id },
      select: { ownerId: true, name: true },
    })

    if (!file) {
      throw new Error("File not found")
    }

    if (file.ownerId !== userId) {
      throw new Error("You don't have permission to update this file")
    }

    const updatedFile = await db.driveFile.update({
      where: { id },
      data,
    })

    await logActivity({
      actionType: "Updated File",
      targetType: "DriveFile",
      targetId: id,
      details: `Updated file: ${file.name} to folder ID: ${data.folderId}`,
    })

    revalidatePath("/drive")
    return updatedFile
  } catch (error) {
    console.error("Error updating file:", error)
    throw new Error("Failed to update file")
  }
}
export async function updateFileName(fileId: number, newName: string) {
  const session = await getSession()
  if (!session?.user) throw new Error("Not authenticated")

  const userId = Number(session.user.id)

  const file = await db.driveFile.findUnique({
    where: { id: fileId },
  })

  if (!file) throw new Error("File not found")
  if (file.ownerId !== userId) throw new Error("Unauthorized")

  const oldPath = path.join(process.cwd(), "uploads", "drive", file.url.split("/").pop() || "")
  const newFileName = `${Date.now()}-${userId}-${newName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const newPath = path.join(process.cwd(), "uploads", "drive", newFileName)

  // Rename file on disk
  await fs.rename(oldPath, newPath)

  const updated = await db.driveFile.update({
    where: { id: fileId },
    data: {
      name: newName,
      url: `/api/drive/file/${newFileName}`,
      updatedAt: new Date(),
    },
  })
  await db2.items.updateMany({
    where: {
      fileid: updated.ownerId,
      name: file.name
    },
    data: {
      name: newName,
    }
  })
  

  await logActivity({
    actionType: "Renamed File",
    targetType: "DriveFile",
    targetId: fileId,
    details: `Renamed file to ${newName}`,
  })

  revalidatePath("/drive")
  return updated
}