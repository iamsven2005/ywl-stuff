// Helper function to decode User Account Control flags
export function decodeUserAccountControl(uac: number) {
    const flags = {
      SCRIPT: 0x0001,
      ACCOUNTDISABLE: 0x0002,
      HOMEDIR_REQUIRED: 0x0008,
      LOCKOUT: 0x0010,
      PASSWD_NOTREQD: 0x0020,
      PASSWD_CANT_CHANGE: 0x0040,
      ENCRYPTED_TEXT_PWD_ALLOWED: 0x0080,
      TEMP_DUPLICATE_ACCOUNT: 0x0100,
      NORMAL_ACCOUNT: 0x0200,
      INTERDOMAIN_TRUST_ACCOUNT: 0x0800,
      WORKSTATION_TRUST_ACCOUNT: 0x1000,
      SERVER_TRUST_ACCOUNT: 0x2000,
      DONT_EXPIRE_PASSWORD: 0x10000,
      MNS_LOGON_ACCOUNT: 0x20000,
      SMARTCARD_REQUIRED: 0x40000,
      TRUSTED_FOR_DELEGATION: 0x80000,
      NOT_DELEGATED: 0x100000,
      USE_DES_KEY_ONLY: 0x200000,
      DONT_REQ_PREAUTH: 0x400000,
      PASSWORD_EXPIRED: 0x800000,
      TRUSTED_TO_AUTH_FOR_DELEGATION: 0x1000000,
      PARTIAL_SECRETS_ACCOUNT: 0x04000000,
    }
  
    const activeFlags = []
    for (const [flag, value] of Object.entries(flags)) {
      if ((uac & value) === value) {
        activeFlags.push(flag)
      }
    }
  
    return activeFlags
  }
  
  // Helper to format Windows file time to readable date
  export function formatFileTime(fileTime: bigint | null): string {
    if (!fileTime || fileTime === BigInt(0) || fileTime === BigInt(9223372036854775807)) {
      return "Never"
    }
  
    // Windows file time is 100-nanosecond intervals since January 1, 1601 UTC
    // JavaScript time is milliseconds since January 1, 1970 UTC
    // Need to subtract 11644473600000 milliseconds to convert
    const windowsEpochOffset = BigInt(116444736000000000)
    const jsTimestamp = Number((fileTime - windowsEpochOffset) / BigInt(10000))
  
    return new Date(jsTimestamp).toLocaleString()
  }
  
  // Parse LDAP timestamp format (YYYYMMDDhhmmss.fZ)
  export function parseLdapTimestamp(timestamp: string): Date | null {
    try {
      // Format: YYYYMMDDhhmmss.fZ
      // Example: 20250325064947.0Z
      const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d+)Z$/)
      if (!match) return null
  
      const [_, year, month, day, hour, minute, second] = match
      return new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1, // JavaScript months are 0-indexed
        Number.parseInt(day, 10),
        Number.parseInt(hour, 10),
        Number.parseInt(minute, 10),
        Number.parseInt(second, 10),
      )
    } catch (error) {
      console.error("Error parsing LDAP timestamp:", error)
      return null
    }
  }
  
  