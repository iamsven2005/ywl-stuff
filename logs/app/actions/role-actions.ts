"use server"
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Get all roles
export async function getRoles() {
  try {
    const roles = await db.roles.findMany();
    return { roles };
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
  if (!id) {
    throw new Error("Role ID is required");
  }

  try {
    const updatedRole = await db.roles.update({
      where: { id },
      data: roleData,
    });
    return updatedRole;
  } catch (error) {
    console.error("Error updating role:", error);
    throw new Error("Failed to update role");
  }
}

// Delete a role
export async function deleteRole(id: number) {
  if (!id) {
    throw new Error("Role ID is required");
  }

  try {
    await db.roles.delete({ where: { id } });
    return { message: "Role deleted successfully" };
  } catch (error) {
    console.error("Error deleting role:", error);
    throw new Error("Failed to delete role");
  }
}