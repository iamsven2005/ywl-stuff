"use server"
import { db } from "@/lib/db"
import { JobTitle } from "@prisma/client"

export async function createJobTitle(data: JobTitle) {
  return db.jobTitle.create({ data })
}

export async function bulkInsertJobTitles(titles: JobTitle) {
    console.log(titles)
  return db.jobTitle.createMany({ data: titles })
}

export async function getJobTitles() {
  return db.jobTitle.findMany({ orderBy: { sn: "asc" } })
}

export async function deleteJobTitles(ids: number[]) {
    try {
      await db.jobTitle.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })
      
      return { success: true }
    } catch (error) {
      console.error("Error deleting job titles:", error)
      throw new Error("Failed to delete job titles")
    }
  }
  