// Helper function to format Windows FileTime to readable date
export function formatLdapTimestamp(timestamp: bigint | null | undefined): string {
  if (!timestamp || timestamp === BigInt(0)) return "Never"

  // Windows FileTime is in 100-nanosecond intervals since January 1, 1601 UTC
  // Convert to JavaScript timestamp (milliseconds since January 1, 1970 UTC)
  const jsTimestamp = Number(timestamp) / 10000 - 11644473600000

  // Format the date
  return new Date(jsTimestamp).toLocaleString()
}

// Helper function to interpret userAccountControl flags
export function getUserAccountStatus(userAccountControl: number): {
  status: string
  isDisabled: boolean
  isLocked: boolean
  passwordExpired: boolean
  passwordNeverExpires: boolean
} {
  // Common userAccountControl flags
  const DISABLED = 0x0002
  const LOCKED = 0x0010
  const PASSWORD_EXPIRED = 0x800000
  const DONT_EXPIRE_PASSWORD = 0x10000

  const isDisabled = (userAccountControl & DISABLED) === DISABLED
  const isLocked = (userAccountControl & LOCKED) === LOCKED
  const passwordExpired = (userAccountControl & PASSWORD_EXPIRED) === PASSWORD_EXPIRED
  const passwordNeverExpires = (userAccountControl & DONT_EXPIRE_PASSWORD) === DONT_EXPIRE_PASSWORD

  let status = "Active"

  if (isDisabled) status = "Disabled"
  else if (isLocked) status = "Locked"
  else if (passwordExpired) status = "Password Expired"

  return {
    status,
    isDisabled,
    isLocked,
    passwordExpired,
    passwordNeverExpires,
  }
}

