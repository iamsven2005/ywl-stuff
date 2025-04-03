import type { Book } from "./types"

export function parseBookData(htmlContent: string): Book[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, "text/html")

  const books: Book[] = []

  // Find the table with book data
  const tableRows = doc.querySelectorAll("table.table_layout tbody tr")

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td")

    // Skip if we don't have enough cells
    if (cells.length < 11) return

    // Extract data from cells (skip the first two cells which are for controls and numbering)
    const hasPdf = cells[2].querySelector("img") !== null
    const category = cells[3].textContent?.trim() || ""
    const refNo = cells[4].textContent?.trim() || ""
    const title = cells[5].textContent?.trim() || ""
    const author = cells[6].textContent?.trim() || ""
    const pubYear = cells[7].textContent?.trim() || ""
    const creationDate = cells[8].textContent?.trim() || ""
    const borrower = cells[9].textContent?.trim() || ""
    const loanDate = cells[10].textContent?.trim() || ""
    const remarks = cells.length > 11 ? cells[11].textContent?.trim() || "" : ""

    // Skip empty rows
    if (!title && !refNo) return

    books.push({
      hasPdf,
      category,
      refNo,
      title,
      author,
      pubYear,
      creationDate,
      borrower,
      loanDate,
      remarks,
      isBorrowed: borrower !== "",
    })
  })

  return books
}

