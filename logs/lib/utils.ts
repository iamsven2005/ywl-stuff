import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatDate(dateString: string, options: Intl.DateTimeFormatOptions = {}) {
  const date = new Date(dateString)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date)
}
