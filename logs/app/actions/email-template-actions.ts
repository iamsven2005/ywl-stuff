"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"
import { getAdminUsers } from "./user-actions"

interface EmailTemplateData {
  name: string
  subject: string
  body: string
}

export async function createEmailTemplate(data: EmailTemplateData & { assignedUsers?: number[] }) {
    try {
      const emailTemplate = await db.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          body: data.body,
          assignedUsers: data.assignedUsers
            ? {
                create: data.assignedUsers.map(userId => ({
                  user: {
                    connect: { id: userId }, // Connect users via UserEmailTemplate
                  },
                })),
              }
            : undefined, // Only include if users are assigned
        },
        include: {
          assignedUsers: {
            include: { user: true },
          },
        },
      });
  
      return { success: true, emailTemplate };
    } catch (error: any) {
      console.error("Error creating email template:", error);
      throw new Error(`Failed to create email template: ${error.message || "Unknown error"}`);
    }
  }
  

export async function updateEmailTemplate(data: {
  id: number
  name: string
  subject: string
  body: string
}) {
  try {
    const emailTemplate = await db.emailTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Email Template",
      targetType: "EmailTemplate",
      targetId: emailTemplate.id,
      details: `Updated email template: ${data.name}`,
    })

    revalidatePath("/logs")
    return { success: true, emailTemplate }
  } catch (error: any) {
    console.error("Error updating email template:", error)
    throw new Error(`Failed to update email template: ${error.message || "Unknown error"}`)
  }
}

export async function deleteEmailTemplate(id: number) {
  try {
    // Get the email template name before deletion
    const emailTemplate = await db.emailTemplate.findUnique({
      where: { id },
      select: { name: true },
    })

    await db.emailTemplate.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Email Template",
      targetType: "EmailTemplate",
      targetId: id,
      details: `Deleted email template: ${emailTemplate?.name || "Unknown"}`,
    })

    revalidatePath("/logs")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting email template:", error)
    throw new Error(`Failed to delete email template: ${error.message || "Unknown error"}`)
  }
}

export async function getEmailTemplate(id: number) {
  try {
    const emailTemplate = await db.emailTemplate.findUnique({
      where: { id },
    })
    return emailTemplate
  } catch (error: any) {
    console.error("Error fetching email template:", error)
    throw new Error(`Failed to fetch email template: ${error.message || "Unknown error"}`)
  }
}

export async function getAllEmailTemplates() {
    try {
      const emailTemplates = await db.emailTemplate.findMany({
        include: {
          assignedUsers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true, // Only return id and username
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
  
      return emailTemplates.map(template => ({
        ...template,
        createdAt: template.createdAt.toISOString(), // Convert Date to string
        updatedAt: template.updatedAt.toISOString(),
        assignedUsers: template.assignedUsers.map(relation => relation.user), // Extract assigned user details
      }));
    } catch (error: any) {
      console.error("Error fetching all email templates:", error);
      throw new Error(`Failed to fetch email templates: ${error.message || "Unknown error"}`);
    }
  }
  
  
  
// Send an email using a template
export async function sendEmailWithTemplate(templateId: number, recipientIds: number[], data: Record<string, string>) {
  try {
    // Get the email template
    const template = await getEmailTemplate(templateId);
    if (!template) {
      return { success: false, error: "Email template not found" };
    }

    // Get recipients (fetch all users if recipientIds is not provided)
    const recipients = await db.user.findMany({
      where: recipientIds?.length ? { id: { in: recipientIds } } : {}, // Fetch all if no recipientIds
      select: { id: true, email: true, username: true },
    });

    if (recipients.length === 0) {
      return { success: false, error: "No valid recipients found" };
    }

    let emailResults = [];

    // Iterate over each recipient and send emails one by one
    for (const recipient of recipients) {
      let subject = template.subject;
      let body = template.body;

      // Replace placeholders in subject and body
      Object.entries({ ...data, username: recipient.username }).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, "g");
        subject = subject.replace(placeholder, value);
        body = body.replace(placeholder, value);
      });

      try {
        const response = await fetch("http://192.168.1.102:3000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient.email, // Send individually
            subject: subject,
            html: body,
          }),
        });

        const resData = await response.json();
        emailResults.push({ email: recipient.email, success: resData.success, messageId: resData.messageId || null });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        emailResults.push({ email: recipient.email, success: false, error: "Failed to send email" });
      }
    }

    // Log the activity
    await logActivity({
      actionType: "Sent Email",
      targetType: "EmailTemplate",
      targetId: templateId,
      details: `Email sent to ${recipients.length} recipients using template "${template.name}"`,
    });

    return { success: true, results: emailResults };
  } catch (error: any) {
    console.error("Failed to send emails:", error);
    return { success: false, error: "Failed to send emails" };
  }
}

// Send an email template to all admin users
export async function sendEmailToAllAdmins(templateId: number, data: Record<string, string>) {
  try {
    // Get all admin users
    const adminUsers = await getAdminUsers()

    if (adminUsers.length === 0) {
      return { success: false, error: "No admin users found" }
    }

    // Get admin user IDs
    const adminUserIds = adminUsers.map((user) => user.id)

    // Send the email to all admin users
    const result = await sendEmailWithTemplate(templateId, adminUserIds, data)

    if (result.success) {
      return {
        success: true,
        message: `Email sent to ${adminUsers.length} admin users`,
        recipients: adminUsers,
      }
    } else {
      return result
    }
  } catch (error: any) {
    console.error("Failed to send email to admins:", error)
    return { success: false, error: "Failed to send email to admin users" }
  }
}

export async function assignUsersToEmailTemplate(emailTemplateId: number, userIds: number[]) {
    try {
      await db.userEmailTemplate.createMany({
        data: userIds.map((userId) => ({
          userId,
          emailTemplateId,
        })),
        skipDuplicates: true, // Avoid duplicate assignments
      });
  
      return { success: true };
    } catch (error) {
      console.error("Error assigning users to email template:", error);
      throw new Error("Failed to assign users to email template");
    }
  }

  export async function removeUsersFromEmailTemplate(emailTemplateId: number, userIds: number[]) {
    try {
      await db.userEmailTemplate.deleteMany({
        where: {
          emailTemplateId,
          userId: { in: userIds },
        },
      });
  
      return { success: true };
    } catch (error) {
      console.error("Error removing users from email template:", error);
      throw new Error("Failed to remove users from email template");
    }
  }
  
  export async function getUsersAssignedToEmailTemplate(emailTemplateId: number) {
    try {
      const assignedUsers = await db.userEmailTemplate.findMany({
        where: { emailTemplateId },
        include: { user: true }, // Include user details
      });
  
      return assignedUsers.map((relation) => relation.user);
    } catch (error) {
      console.error("Error fetching users for email template:", error);
      throw new Error("Failed to fetch assigned users");
    }
  }
