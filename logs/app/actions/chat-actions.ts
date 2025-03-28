"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "../login/actions"
import { parseXMLDate, type XMLMessage } from "../utils/xml-utils"
import { getSession } from "@/lib/auth"

// Get all groups for the current user
export async function getUserGroups() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const groupMembers = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  })

  return groupMembers.map((gm) => gm.group)
}

// Search groups by name
export async function searchGroups(query: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  if (!query || query.length < 2) {
    return []
  }

  const groupMembers = await db.groupMember.findMany({
    where: {
      userId: user.id,
      group: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
    },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  })

  return groupMembers.map((gm) => gm.group)
}

// Get groups by member role
export async function getGroupsByMemberRole(role: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  if (!role || role === "all") {
    return await getUserGroups()
  }

  const groupMembers = await db.groupMember.findMany({
    where: {
      userId: user.id,
      group: {
        members: {
          some: {
            user: {
              role: {
                has: role,
              },
            },
          },
        },
      },
    },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  })

  return groupMembers.map((gm) => gm.group)
}

// Get messages for a specific group
export async function getGroupMessages(groupId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Check if user is a member of this group
  const isMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  })

  if (!isMember) {
    throw new Error("You are not a member of this group")
  }

  const messages = await db.message.findMany({
    where: { groupId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return messages
}

// Send a message to a group
export async function sendMessage(groupId: number, content: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Check if user is a member of this group
  const isMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  })

  if (!isMember) {
    throw new Error("You are not a member of this group")
  }

  const message = await db.message.create({
    data: {
      content,
      senderId: user.id,
      groupId,
    },
  })

  // Update the group's updatedAt timestamp
  await db.group.update({
    where: { id: groupId },
    data: { updatedAt: new Date() },
  })

  revalidatePath("/chat")
  return message
}

// Get all users for creating a new group
export async function getAllUsers() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const users = await db.user.findMany({
    where: {
      id: { not: user.id }, // Exclude current user
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
    orderBy: { username: "asc" },
  })

  return users
}

// Get available roles for filtering
export async function getAvailableRoles() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const users = await db.user.findMany({
    select: {
      role: true,
    },
  })

  // Extract unique roles from all users
  const allRoles = users.flatMap((user) => user.role || [])
  const uniqueRoles = [...new Set(allRoles)]

  return uniqueRoles
}

// Create a new group
export async function createGroup(name: string, memberIds: number[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Create the group
  const group = await db.group.create({
    data: {
      name,
      createdBy: user.username,
      members: {
        create: [
          // Add current user as a member
          { userId: user.id },
          // Add selected users as members
          ...memberIds.map((id) => ({ userId: id })),
        ],
      },
    },
  })

  revalidatePath("/chat")
  return group
}

// Get group details with members
export async function getGroupWithMembers(groupId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Check if user is a member of this group
  const isMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  })

  if (!isMember) {
    throw new Error("You are not a member of this group")
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  })

  return group
}

// Remove a user from a group
export async function removeUserFromGroup(groupId: number, userId: number) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  // Check if current user is a member of this group
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { createdBy: true },
  })

  if (!group) {
    throw new Error("Group not found")
  }

  // Only the group creator or an admin can remove users
  if (group.createdBy !== currentUser.username && !currentUser.role.includes("admin")) {
    throw new Error("You don't have permission to remove users from this group")
  }

  // Cannot remove yourself if you're the creator
  if (userId === currentUser.id && group.createdBy === currentUser.username) {
    throw new Error("As the group creator, you cannot remove yourself")
  }

  // Remove the user from the group
  await db.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  revalidatePath("/chat")
  return { success: true }
}

// Search for users
export async function searchUsers(query: string, role?: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  if (!query || query.length < 2) {
    return []
  }

  const whereClause: any = {
    OR: [{ username: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }],
    id: { not: currentUser.id }, // Exclude current user
  }

  // Add role filter if provided
  if (role && role !== "all") {
    whereClause.role = {
      has: role,
    }
  }

  const users = await db.user.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
    take: 10,
  })

  return users
}

// Search users by role
export async function searchUsersByRole(role: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  if (!role || role === "all") {
    return []
  }

  const users = await db.user.findMany({
    where: {
      role: {
        has: role,
      },
      id: { not: currentUser.id }, // Exclude current user
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
    take: 20,
  })

  return users
}

// Add a user to an existing group
export async function addUserToGroup(groupId: number, userId: number) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  // Check if current user is a member of this group
  const isMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: currentUser.id,
        groupId,
      },
    },
  })

  if (!isMember) {
    throw new Error("You are not a member of this group")
  }

  // Check if user is already a member
  const existingMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  if (existingMember) {
    throw new Error("User is already a member of this group")
  }

  // Add the user to the group
  await db.groupMember.create({
    data: {
      userId,
      groupId,
    },
  })

  revalidatePath("/chat")
  return { success: true }
}

// Search messages in a group
export async function searchMessages(groupId: number, query: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Check if user is a member of this group
  const isMember = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  })

  if (!isMember) {
    throw new Error("You are not a member of this group")
  }

  if (!query || query.length < 2) {
    return []
  }

  const messages = await db.message.findMany({
    where: {
      groupId,
      content: {
        contains: query,
        mode: "insensitive",
      },
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return messages
}

// Delete a message
export async function deleteMessage(messageId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Get the message
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: {
      group: true,
    },
  })

  if (!message) {
    throw new Error("Message not found")
  }

  // Check if the user is the sender of the message
  if (message.senderId !== user.id) {
    throw new Error("You can only delete your own messages")
  }

  // Delete the message
  await db.message.delete({
    where: { id: messageId },
  })

  revalidatePath("/chat")
  return { success: true }
}

// Edit a message
export async function editMessage(messageId: number, newContent: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Get the message
  const message = await db.message.findUnique({
    where: { id: messageId },
  })

  if (!message) {
    throw new Error("Message not found")
  }

  // Check if the user is the sender of the message
  if (message.senderId !== user.id) {
    throw new Error("You can only edit your own messages")
  }

  // Update the message
  await db.message.update({
    where: { id: messageId },
    data: {
      content: newContent,
      edited: true,
    },
  })

  revalidatePath("/chat")
  return { success: true }
}

// Update the importXMLMessages function to use our new date parsing
export async function importXMLMessages(groupId: number, messages: XMLMessage[]) {
  try {
    // Get the current user ID from the session
    const session = await getSession()
    if (!session?.user?.id) {
      throw new Error("You must be logged in to import messages")
    }

    // Get the group to verify it exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    })

    if (!group) {
      throw new Error("Group not found")
    }

    // Check if the current user is a member of the group
    const isMember = group.members.some((member) => member.userId === session.user.id)
    if (!isMember) {
      throw new Error("You are not a member of this group")
    }

    // Get all users to map emails to user IDs
    const users = await db.user.findMany()
    const emailToUserMap = new Map()
    users.forEach((user) => {
      if (user.email) {
        emailToUserMap.set(user.email.toLowerCase(), user.id)
      }
    })

    // Process and import messages
    const importedMessages = []

    for (const message of messages) {
      try {
        // Extract email from the from field (remove any client info after /)
        const fromEmail = message.from.split("/")[0].toLowerCase()

        // Find the sender ID
        let senderId = emailToUserMap.get(fromEmail)

        // If sender not found, use the current user as the sender
        if (!senderId) {
          senderId = session.user.id
        }

        // Parse the date using our custom function
        const parsedDate = parseXMLDate(message.date)

        // Create the message
        const newMessage = await db.message.create({
          data: {
            content: message.body,
            senderId,
            groupId,
            createdAt: parsedDate,
          },
        })

        importedMessages.push(newMessage)
      } catch (error) {
        console.error(`Error importing message: ${message.body}`, error)
        // Continue with next message
      }
    }

    // Log the activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        actionType: "IMPORT_MESSAGES",
        details: `Imported ${importedMessages.length} messages to group ${groupId}`,
        targetType: "CHAT",
        targetId: groupId,
      },
    })

    revalidatePath("/chat")
    return { success: true, count: importedMessages.length }
  } catch (error) {
    console.error("Error importing XML messages:", error)
    throw error
  }
}

export async function getGroupMessagesWithDetails(groupId: number) {
  try {
    const messages = await db.message.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    // Get group details to include receiver information
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
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
      },
    })

    // Transform messages to include receiver details
    const messagesWithDetails = messages.map((message) => ({
      ...message,
      senderName: message.sender.username,
      senderEmail: message.sender.email,
      receiverName: group?.name,
      receiverEmail: null, // Group chat doesn't have a single receiver email
    }))

    return messagesWithDetails
  } catch (error) {
    console.error("Error fetching messages with details:", error)
    throw error
  }
}

