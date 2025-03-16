import * as XLSX from "xlsx"

// Function to export data to Excel
export function exportToExcel(data: any[], filename: string) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new()

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Function to prepare logs data for export
export function prepareLogsForExport(logs: any[]) {
  return logs.map((log) => {
    // Create a flattened version of the log for Excel
    return {
      ID: log.id,
      Name: log.name,
      Host: log.host || "",
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.piuser || "",
      PID: log.pid || "",
      Action: log.action || "",
      "CPU %": log.cpu !== null ? `${log.cpu.toFixed(1)}%` : "",
      "Memory %": log.mem !== null ? `${log.mem.toFixed(1)}%` : "",
      Command: log.command || "",
    }
  })
}

// Function to prepare auth logs data for export
export function prepareAuthLogsForExport(logs: any[]) {
  return logs.map((log) => {
    return {
      ID: log.id,
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Username: log.username || "",
      "Log Entry": log.log_entry || "",
    }
  })
}

// Function to prepare devices data for export
export function prepareDevicesForExport(devices: any[]) {
  return devices.map((device) => {
    return {
      ID: device.id,
      Name: device.name,
      "IP Address": device.ip_address || "",
      "MAC Address": device.mac_address || "",
      Added: new Date(device.time).toLocaleString(),
      Notes: device.notes || "",
    }
  })
}

// Function to prepare users data for export
export function prepareUsersForExport(users: any[]) {
  return users.map((user) => {
    return {
      ID: user.id,
      Username: user.username,
      Email: user.email || "",
      "Created At": new Date(user.createdAt).toLocaleString(),
      "Updated At": new Date(user.updatedAt).toLocaleString(),
      "Device Count": user.devices?.length || 0,
    }
  })
}

// Function to prepare chart data for export
export function prepareChartDataForExport(chartData: any[], metricType: string) {
  return chartData.map((entry) => {
    const result: Record<string, any> = {
      Timestamp: new Date(entry.timestamp).toLocaleString(),
    }

    // Add each device's data
    Object.keys(entry).forEach((key) => {
      if (key !== "timestamp") {
        if (metricType === "all") {
          // For usage chart with CPU and memory
          if (entry[key].cpu !== undefined) {
            result[`${key} CPU %`] = entry[key].cpu !== null ? Number(entry[key].cpu).toFixed(1) : ""
          }
          if (entry[key].mem !== undefined) {
            result[`${key} Memory %`] = entry[key].mem !== null ? Number(entry[key].mem).toFixed(1) : ""
          }
        } else if (metricType === "memory") {
          // For memory usage chart
          if (entry[key].percent_usage !== undefined) {
            result[`${key} %`] = entry[key].percent_usage !== null ? Number(entry[key].percent_usage).toFixed(1) : ""
          }
        } else if (metricType === "sensor") {
          // For sensor chart
          if (entry[key].value !== undefined) {
            const unit = entry[key].type === "temperature" ? "°C" : "mV"
            result[`${key} (${unit})`] = entry[key].value !== null ? Number(entry[key].value).toFixed(1) : ""
          }
        } else {
          // For specific metric type (cpu or mem)
          if (entry[key][metricType] !== undefined) {
            result[`${key} %`] = entry[key][metricType] !== null ? Number(entry[key][metricType]).toFixed(1) : ""
          }
        }
      }
    })

    return result
  })
}

// Add a function to prepare devices for import
export function validateImportedDevices(data: any[]) {
  const validDevices = []
  const errors = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 2 // +2 because Excel starts at 1 and we have a header row

    // Extract device data from row
    const device = {
      name: row.Name || row.name || "",
      ip_address: row.IP_Address || row["IP Address"] || row.ip_address || null,
      mac_address: row.MAC_Address || row["MAC Address"] || row.mac_address || null,
      password: row.Password || row.password || null,
      notes: row.Notes || row.notes || "",
    }

    // Validate required fields
    if (!device.name) {
      errors.push(`Row ${rowNumber}: Device name is required`)
      continue
    }

    // Validate IP address format if provided
    if (device.ip_address && !isValidIpAddress(device.ip_address)) {
      errors.push(`Row ${rowNumber}: Invalid IP address format`)
      continue
    }

    // Validate MAC address format if provided
    if (device.mac_address && !isValidMacAddress(device.mac_address)) {
      errors.push(`Row ${rowNumber}: Invalid MAC address format`)
      continue
    }

    validDevices.push(device)
  }

  return { validDevices, errors }
}

// Helper function to validate IP address format
function isValidIpAddress(ip: string) {
  // Simple regex for IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipv4Regex.test(ip)) return false

  // Check each octet is in range 0-255
  const octets = ip.split(".")
  return octets.every((octet) => {
    const num = Number.parseInt(octet, 10)
    return num >= 0 && num <= 255
  })
}

// Helper function to validate MAC address format
function isValidMacAddress(mac: string) {
  // Regex for common MAC address formats (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
  return macRegex.test(mac)
}

// Add a template generator function for device imports
export function generateDeviceImportTemplate() {
  const template = [
    {
      Name: "Example Device 1",
      "IP Address": "192.168.1.100",
      "MAC Address": "00:1A:2B:3C:4D:5E",
      Password: "password123",
      Notes: "Example device for import",
    },
    {
      Name: "Example Device 2",
      "IP Address": "192.168.1.101",
      "MAC Address": "00:1A:2B:3C:4D:5F",
      Password: "",
      Notes: "Another example device",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Devices")

  // Generate Excel file
  XLSX.writeFile(workbook, "device-import-template.xlsx")
}

// Add a template generator function for user imports
export function generateUserImportTemplate() {
  const template = [
    {
      Username: "example_user1",
      Email: "user1@example.com",
      Password: "password123",
    },
    {
      Username: "example_user2",
      Email: "user2@example.com",
      Password: "securepass456",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users")

  // Generate Excel file
  XLSX.writeFile(workbook, "user-import-template.xlsx")
}

