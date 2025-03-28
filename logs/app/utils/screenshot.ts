import domtoimage from "dom-to-image"

export async function takeScreenshot(elementId: string, filename = "chat-screenshot.png") {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`)
    }

    // Use dom-to-image for better compatibility
    const dataUrl = await domtoimage.toJpeg(element, {
      quality: 0.95,
      bgcolor: document.documentElement.classList.contains("dark") ? "#1a1a1a" : "#ffffff",
      style: {
        "background-color": document.documentElement.classList.contains("dark") ? "#1a1a1a" : "#ffffff",
      },
      filter: (node) => {
        // Skip invisible elements
        if (node instanceof HTMLElement) {
          const style = window.getComputedStyle(node)
          return style.display !== "none" && style.visibility !== "hidden"
        }
        return true
      },
    })

    // Create download link
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Copy to clipboard
    await copyImageToClipboard(dataUrl)

    return true
  } catch (error) {
    console.error("Error taking screenshot:", error)
    throw error
  }
}

async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    // Convert data URL to Blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()

    // Try to use the clipboard API to copy the image
    if (navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({
        [blob.type]: blob,
      })
      await navigator.clipboard.write([item])
      return true
    } else {
      // Fallback for browsers that don't support clipboard.write with images
      console.warn("Clipboard API for images not supported in this browser")
      return false
    }
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error)
    return false
  }
}

