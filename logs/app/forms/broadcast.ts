// Simple in-memory event broadcasting system
// In production, you would use Redis or a similar solution for multi-server setups

type Listener = (data: any) => void

interface EventBus {
  [key: string]: {
    listeners: Listener[]
    lastEvent?: any
  }
}

// Store event listeners by channel
const eventBus: EventBus = {}

// Subscribe to a channel
export function subscribe(channel: string, listener: Listener) {
  if (!eventBus[channel]) {
    eventBus[channel] = { listeners: [] }
  }

  eventBus[channel].listeners.push(listener)

  // Send the last event to new subscribers (useful for late joiners)
  if (eventBus[channel].lastEvent) {
    listener(eventBus[channel].lastEvent)
  }

  // Return unsubscribe function
  return () => {
    eventBus[channel].listeners = eventBus[channel].listeners.filter((l) => l !== listener)
  }
}

// Publish an event to a channel
export function publish(channel: string, data: any) {
  if (!eventBus[channel]) {
    eventBus[channel] = { listeners: [] }
  }

  // Store the last event for late joiners
  eventBus[channel].lastEvent = data

  // Notify all listeners
  eventBus[channel].listeners.forEach((listener) => {
    try {
      listener(data)
    } catch (error) {
      console.error(`Error in event listener for channel ${channel}:`, error)
    }
  })
}

// Get active listener count for a channel
export function getListenerCount(channel: string): number {
  return eventBus[channel]?.listeners.length || 0
}

// Clear all listeners for testing/cleanup
export function clearAllListeners() {
  Object.keys(eventBus).forEach((channel) => {
    eventBus[channel].listeners = []
  })
}
