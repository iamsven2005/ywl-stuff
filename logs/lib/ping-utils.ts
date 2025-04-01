import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function pingDevice(ipAddress: string): Promise<boolean> {
  try {
    // Use different ping commands based on the operating system
    const pingCommand = process.platform === "win32" ? `ping -n 1 -w 1000 ${ipAddress}` : `ping -c 1 -W 1 ${ipAddress}`

    await execPromise(pingCommand)
    return true // Device is reachable
  } catch (error) {
    return false // Device is unreachable
  }
}

