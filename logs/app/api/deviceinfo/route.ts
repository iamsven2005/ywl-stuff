import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  const data = await req.json();
  const { hostname, timestamp, processes, sensors, disks } = data;

  console.log(`\n===== Device Info from ${hostname} at ${timestamp} =====`);

  // Insert Processes (Logs)
  if (processes?.length) {
    await db.logs.createMany({
      data: processes.map((proc: any) => ({
        hostname,
        pid: proc.pid,
        name: proc.name,
        cpuTime: proc.cpuTime,
        memoryMB: proc.memoryMB,
      })),
      skipDuplicates: true,
    });
  }

  // Insert Sensor Data
  if (sensors?.length) {
    await db.system_metrics.createMany({
      data: sensors.map((sensor: any) => ({
        hostname,
        name: sensor.name,
        value: sensor.value,
        min: sensor.min ?? null,
        max: sensor.max ?? null,
      })),
    });
  }

  // Insert Disk Info
  if (disks?.length) {
    await db.diskMetric.createMany({
      data: disks.map((disk: any) => ({
        hostname,
        name: disk.name,
        label: disk.label,
        totalGB: disk.totalGB,
        usedGB: disk.usedGB,
        freeGB: disk.freeGB,
      })),
    });
  }

  return NextResponse.json({ status: 'success' });
}
