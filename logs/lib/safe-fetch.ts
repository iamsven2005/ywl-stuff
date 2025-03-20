/**
 * Safely executes a fetch operation and returns null if it fails
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response or null if it fails
 */
export async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(url, options)
  
      if (!response.ok) {
        console.warn(`Fetch error: ${response.status} ${response.statusText}`)
        return null
      }
  
      return (await response.json()) as T
    } catch (error) {
      console.error("Fetch error:", error)
      return null
    }
  }
  
  