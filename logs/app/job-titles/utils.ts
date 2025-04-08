export interface JobTitle {
    sn: string
    jobTitle: string
    abbreviation: string
    grade: string
    seniorityLevel: string
    selectableInStaffCV: string
  }
  
  export function parseHtmlContent(htmlContent: string): JobTitle[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
  
    // Find the table with job titles
    const tables = doc.querySelectorAll("table")
    let jobTitlesTable: HTMLTableElement | null = null
  
    // Look for a table that has the expected column headers
    for (const table of tables) {
      const headerRow = table.querySelector("thead tr")
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll("th")
        const headerTexts = Array.from(headerCells).map((cell) => cell.textContent?.trim())
  
        // Check if this table has the expected headers
        if (
          headerTexts.includes("S/N") &&
          headerTexts.includes("Job Title") &&
          headerTexts.includes("Abbreviation") &&
          headerTexts.includes("Grade") &&
          headerTexts.includes("Seniority Level") &&
          headerTexts.some((text) => text?.includes("Selectable"))
        ) {
          jobTitlesTable = table
          break
        }
      }
    }
  
    if (!jobTitlesTable) {
      throw new Error("Could not find job titles table in the HTML content")
    }
  
    // Extract data from the table
    const rows = jobTitlesTable.querySelectorAll("tbody tr")
    const jobTitles: JobTitle[] = []
  
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td")
  
      // Skip header row or rows with insufficient cells
      if (cells.length < 6) return
  
      // Extract cell values, skipping the first cell which is usually for row status
      const sn = cells[1]?.textContent?.trim() || ""
      const jobTitle = cells[2]?.textContent?.trim() || ""
      const abbreviation = cells[3]?.textContent?.trim() || ""
      const grade = cells[4]?.textContent?.trim() || ""
      const seniorityLevel = cells[5]?.textContent?.trim() || ""
      const selectableInStaffCV = cells[6]?.textContent?.trim() || ""
  
      // Only add if we have the essential data
      if (sn && jobTitle) {
        jobTitles.push({
          sn,
          jobTitle,
          abbreviation,
          grade,
          seniorityLevel,
          selectableInStaffCV,
        })
      }
    })
  
    return jobTitles
  }
  
  // Alternative parsing method for when DOMParser is not available (server-side)
  export function parseHtmlContentAlternative(htmlContent: string): JobTitle[] {
    const jobTitles: JobTitle[] = []
  
    // Look for table rows with the pattern we expect
    const rowRegex = /<tr[^>]*class="[^"]*_tr_\d+"[^>]*>([\s\S]*?)<\/tr>/g
    let rowMatch
  
    while ((rowMatch = rowRegex.exec(htmlContent)) !== null) {
      const rowContent = rowMatch[1]
  
      // Extract cell values from the row
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g
      const cells: string[] = []
      let cellMatch
  
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        // Extract the text content from the cell
        const cellContent = cellMatch[1]
        const valueRegex = /<input[^>]*value="([^"]*)"[^>]*>/
        const valueMatch = valueRegex.exec(cellContent)
  
        if (valueMatch) {
          cells.push(valueMatch[1])
        } else {
          cells.push("")
        }
      }
  
      // Skip rows with insufficient cells
      if (cells.length < 7) continue
  
      // Create job title object
      jobTitles.push({
        sn: cells[1] || "",
        jobTitle: cells[2] || "",
        abbreviation: cells[3] || "",
        grade: cells[4] || "",
        seniorityLevel: cells[5] || "",
        selectableInStaffCV: cells[6] || "",
      })
    }
  
    return jobTitles
  }
  