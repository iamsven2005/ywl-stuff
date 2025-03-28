// Update the POST function to handle value types for sensor data
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const data = await req.json()
  const { hostname, timestamp, processes, sensors, disks } = data

  console.log(`\n===== Device Info from ${hostname} at ${timestamp} =====`)

  // Insert Processes (Logs)
  if (processes?.length) {
    // @ts-ignore
    const { db } = await import("@vercel/postgres")
    await db.logs.createMany({
      data: processes.map((proc: any) => ({
        host: hostname,
        pid: proc.pid,
        name: proc.name,
        cpu: proc.cpuTime,
        mem: proc.memoryMB,
      })),
      skipDuplicates: true,
    })
  }

  // Insert Sensor Data with value type extraction
  if (sensors?.length) {
    // @ts-ignore
    const { db } = await import("@vercel/postgres")
    await db.system_metrics.createMany({
      data: sensors.map((sensor: any) => {
        // Extract value type from sensor name
        const valueType = determineValueType(sensor.name)

        return {
          host: hostname,
          sensor_name: sensor.name,
          value: sensor.value,
          value_type: valueType,
          min: sensor.min ?? null,
          max: sensor.max ?? null,
        }
      }),
    })
  }

  // Insert Disk Info
  if (disks?.length) {
    // @ts-ignore
    const { db } = await import("@vercel/postgres")
    await db.diskMetric.createMany({
      data: disks.map((disk: any) => ({
        host: hostname,
        name: disk.name,
        label: disk.label,
        totalGB: disk.totalGB,
        usedGB: disk.usedGB,
        freeGB: disk.freeGB,
      })),
    })
  }

  return NextResponse.json({ status: "success" })
}

// Helper function to determine value type from sensor name
function determineValueType(sensorName: string): string {
  const lowerName = sensorName.toLowerCase()

  // Temperature sensors
  if (
    lowerName.includes("temperature") ||
    lowerName.includes("temp") ||
    lowerName.includes("°c") ||
    lowerName.includes("tdie") ||
    lowerName.includes("tctl") ||
    lowerName.includes("hot spot")
  ) {
    return "temperature"
  }

  // Voltage sensors
  if (
    lowerName.includes("voltage") ||
    lowerName.includes("volt") ||
    lowerName.includes("vcore") ||
    lowerName.includes("avcc") ||
    lowerName.includes("v standby") ||
    lowerName.includes("cmos battery") ||
    lowerName.includes("vid")
  ) {
    return "voltage"
  }

  // Fan speed sensors
  if (lowerName.includes("fan") && lowerName.includes("rpm")) {
    return "rpm"
  }

  // Fan percentage sensors
  if (lowerName.includes("fan") && lowerName.includes("%")) {
    return "percentage"
  }

  // Power sensors
  if (
    lowerName.includes("power") ||
    lowerName.includes("package") ||
    lowerName.includes("w") ||
    lowerName.includes("watt")
  ) {
    return "power"
  }

  // Frequency/Clock sensors
  if (
    lowerName.includes("mhz") ||
    lowerName.includes("ghz") ||
    lowerName.includes("bus speed") ||
    lowerName.includes("clock")
  ) {
    return "frequency"
  }

  // Current sensors
  if (lowerName.includes("amp") || lowerName.includes("current") || lowerName.includes("a")) {
    return "current"
  }

  // Load/Utilization sensors
  if (
    lowerName.includes("utilization") ||
    lowerName.includes("load") ||
    lowerName.includes("usage") ||
    lowerName.includes("%")
  ) {
    return "percentage"
  }

  // Data rate sensors
  if (lowerName.includes("kb/s") || lowerName.includes("mb/s") || lowerName.includes("speed")) {
    return "data_rate"
  }

  // Memory size sensors
  if (
    lowerName.includes("memory") &&
    (lowerName.includes("gb") || lowerName.includes("mb") || lowerName.includes("kb"))
  ) {
    return "memory_size"
  }

  // Default case
  return "unknown"
}

