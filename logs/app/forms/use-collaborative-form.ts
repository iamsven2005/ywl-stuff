"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"

// Generate a user ID for the current session
const generateUserId = () => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return `temp-${Math.random().toString(36).substring(2, 15)}`
  }

  // Check if we already have a user ID in localStorage
  const storedId = localStorage.getItem("form-builder-user-id")
  if (storedId) return storedId

  // Generate a new ID
  const newId = uuidv4()
  localStorage.setItem("form-builder-user-id", newId)
  return newId
}

// Generate a random user name
const generateUserName = () => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return "Anonymous User"
  }

  // Check if we already have a user name in localStorage
  const storedName = localStorage.getItem("form-builder-user-name")
  if (storedName) return storedName

  // Generate a random name
  const adjectives = ["Happy", "Creative", "Clever", "Bright", "Quick", "Calm"]
  const nouns = ["Editor", "Designer", "Creator", "Builder", "Maker", "User"]

  const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`

  localStorage.setItem("form-builder-user-name", randomName)
  return randomName
}

export function useCollaborativeForm(formId: number | string) {
  const [userId] = useState(() => generateUserId())
  const [userName] = useState(() => generateUserName())

  return {
    userId,
    userName,
    activeUsers: [], // We're not tracking active users in this simplified version
    lastUpdate: null,
    isConnected: true, // Always return true to avoid UI changes
  }
}
