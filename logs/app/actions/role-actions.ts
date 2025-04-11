"use server"
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

import * as XLSX from "xlsx"

type Role = {
  id: number
  name: string
  description: string
}

type User = {
  id: number
  username: string
  email?: string
  role: string[]
}

export async function exportRolesToExcel(roles: Role[], users: User[]) {
  try {
    // Create a workbook with two worksheets
    const wb = XLSX.utils.book_new()

    // 1. Roles worksheet
    const rolesData = roles.map((role) => ({
      ID: role.id,
      Name: role.name,
      Description: role.description || "",
      "User Count": users.filter((user) => user.role.includes(role.name)).length,
    }))

    const rolesWs = XLSX.utils.json_to_sheet(rolesData)
    XLSX.utils.book_append_sheet(wb, rolesWs, "Roles")

    // 2. Users by Role worksheet
    const usersByRoleData: any[] = []

    roles.forEach((role) => {
      const usersWithRole = users.filter((user) => user.role.includes(role.name))

      if (usersWithRole.length === 0) {
        usersByRoleData.push({
          Role: role.name,
          Username: "",
          Email: "",
          "User ID": "",
        })
      } else {
        usersWithRole.forEach((user) => {
          usersByRoleData.push({
            Role: role.name,
            Username: user.username,
            Email: user.email || "",
            "User ID": user.id,
          })
        })
      }
    })

    const usersByRoleWs = XLSX.utils.json_to_sheet(usersByRoleData)
    XLSX.utils.book_append_sheet(wb, usersByRoleWs, "Users by Role")

    // Convert to binary string
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    return {
      success: true,
      buffer: excelBuffer,
      filename: `roles_export_${new Date().toISOString().split("T")[0]}.xlsx`,
    }
  } catch (error) {
    console.error("Excel export error:", error)
    return {
      success: false,
      error: "Failed to export data to Excel",
    }
  }
}

// Get all roles
export async function getRoles() {
  try {
    const roles = await db.roles.findMany({orderBy: {name: "asc"}});
    const users = await db.user.findMany();
    return { roles, users };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return null
  }
}

// Add a new role
export async function addRole(roleData: { name: string; description?: string }) {
  const { name, description = "" } = roleData;

  if (!name) {
    throw new Error("Role name is required");
  }

  try {
    // Check if the role already exists (case-insensitive)
    const existingRole = await db.roles.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingRole) {
      return existingRole; // Role already exists — return it
    }

    // Create new role if not found
    const newRole = await db.roles.create({
      data: { name, description },
    });

    revalidatePath("/logs");
    return newRole;

  } catch (error) {
    console.error("Error creating role:", error);
    throw new Error("Failed to create role");
  }
}


// Update a role
export async function updateRole(id: number, roleData: { name: string; description?: string }) {
  if (!id) throw new Error("Role ID is required");

  try {
    // Step 1: Fetch current role
    const existingRole = await db.roles.findUnique({
      where: { id },
    })

    if (!existingRole) throw new Error("Role not found")

    const oldName = existingRole.name
    const newName = roleData.name

    // Step 2: Update role
    const updatedRole = await db.roles.update({
      where: { id },
      data: roleData,
    })

    // Step 3: Sync users with role name (already in your original logic)
    if (oldName !== newName) {
      const affectedUsers = await db.user.findMany({
        where: {
          role: {
            has: oldName,
          },
        },
      })

      await Promise.all(
        affectedUsers.map((user) => {
          const updatedRoles = user.role.map((r) => (r === oldName ? newName : r))
          return db.user.update({
            where: { id: user.id },
            data: {
              role: updatedRoles,
            },
          })
        })
      )

      // Step 4: Sync RolePermission entries
      await db.rolePermission.updateMany({
        where: {
          roleName: oldName,
        },
        data: {
          roleName: newName,
        },
      })
    }

    return updatedRole
  } catch (error) {
    console.error("Error updating role:", error)
    throw new Error("Failed to update role")
  }
}

// Delete a role, we do not want a many to many, just apprear to look like
export async function deleteRole(id: number) {
  if (!id) {
    throw new Error("Role ID is required")
  }

  try {
    // Step 1: Get role name before deleting
    const role = await db.roles.findUnique({
      where: { id },
    })

    if (!role) {
      throw new Error("Role not found")
    }

    const roleName = role.name

    // Step 2: Delete the role
    await db.roles.delete({
      where: { id },
    })

    // Step 3: Remove the role from all users
    const affectedUsers = await db.user.findMany({
      where: {
        role: {
          has: roleName,
        },
      },
    })

    await Promise.all(
      affectedUsers.map((user) => {
        const updatedRoles = user.role.filter((r) => r !== roleName)
        return db.user.update({
          where: { id: user.id },
          data: {
            role: updatedRoles,
          },
        })
      })
    )

    // Step 4: Delete related RolePermission entries
    await db.rolePermission.deleteMany({
      where: {
        roleName: roleName,
      },
    })

    return { message: `Role "${roleName}" deleted and removed from users and permissions.` }
  } catch (error) {
    console.error("Error deleting role:", error)
    throw new Error("Failed to delete role")
  }
}
