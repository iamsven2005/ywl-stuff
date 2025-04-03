"use server"

import { db } from "@/lib/db"
import Book from "./types"


export async function saveBooksToDB(books: Book[]) {
  try {
    // Start a transaction to ensure all books are saved or none
    const result = await db.$transaction(async (tx) => {
      const savedBooks = []

      for (const book of books) {
        // Convert pubYear to number or null
        let pubYearInt: number | null = null
        if (book.pubYear && book.pubYear.trim() !== "") {
          const year = Number.parseInt(book.pubYear)
          pubYearInt = isNaN(year) ? null : year
        }

        // Convert creationDate string to Date object
        let creationDate: Date
        try {
          creationDate = new Date(book.creationDate)
          // Check if date is valid
          if (isNaN(creationDate.getTime())) {
            creationDate = new Date() // Fallback to current date if invalid
          }
        } catch (error) {
          creationDate = new Date() // Fallback to current date if parsing fails
        }

        // Convert loanDate string to Date object or null
        let loanDate: Date | null = null
        if (book.loanDate && book.loanDate.trim() !== "") {
          try {
            loanDate = new Date(book.loanDate)
            // Check if date is valid
            if (isNaN(loanDate.getTime())) {
              loanDate = null
            }
          } catch (error) {
            loanDate = null
          }
        }

        // Create the library entry
        const savedBook = await tx.libraryEntry.create({
          data: {
            refNo: book.refNo,
            category: book.category,
            title: book.title,
            author: book.author || null,
            pubYear: pubYearInt,
            creationDate,
            borrower: book.borrower || null,
            loanDate,
            remarks: book.remarks || null,
            // We don't have attachment info from the HTML parsing
            attachmentUrl: null,
            attachmentFilename: null,
          },
        })

        savedBooks.push(savedBook)
      }

      return {
        count: savedBooks.length,
        books: savedBooks,
      }
    })

    return {
      success: true,
      message: `Successfully saved ${result.count} books to the database.`,
      count: result.count,
    }
  } catch (error) {
    console.error("Error saving books to database:", error)
    return {
      success: false,
      message: `Error saving books: ${error instanceof Error ? error.message : "Unknown error"}`,
      count: 0,
    }
  }
}

