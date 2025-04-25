"use client"

type ToastProps = {
  title: string
  description?: string
  duration?: number
}

// A simple toast implementation for the demo
// In a real app, you'd use a proper toast library
export function toast(props: ToastProps) {
  const { title, description, duration = 3000 } = props

  // Create a div element for the toast
  const toastElement = document.createElement("div")
  toastElement.className =
    "fixed bottom-4 right-4 z-50 bg-background border rounded-md shadow-lg p-4 max-w-md animate-in fade-in slide-in-from-bottom-5"

  // Create the toast content
  const titleElement = document.createElement("div")
  titleElement.className = "font-medium"
  titleElement.textContent = title
  toastElement.appendChild(titleElement)

  if (description) {
    const descriptionElement = document.createElement("div")
    descriptionElement.className = "text-sm text-muted-foreground mt-1"
    descriptionElement.textContent = description
    toastElement.appendChild(descriptionElement)
  }

  // Add the toast to the document
  document.body.appendChild(toastElement)

  // Remove the toast after the duration
  setTimeout(() => {
    toastElement.classList.add("animate-out", "fade-out", "slide-out-to-right-5")
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, 300)
  }, duration)
}
