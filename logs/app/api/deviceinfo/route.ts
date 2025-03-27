import { NextRequest, NextResponse } from 'next/server';

type ProcessInfo = {
  pid: number;
  name: string;
  cpuTime: number;
  memoryMB: number;
};

type DiskInfo = {
  name: string;
  label: string | null;
  totalGB: number;
  usedGB: number;
  freeGB: number;
};

type SensorInfo = {
  name: string;
  value: string;
  min?: string;
  max?: string;
};

export async function POST(req: NextRequest) {
  const data = await req.json();

  console.log(`\n===== Device Info from ${data.hostname} at ${data.timestamp} =====`);

  // --- Log Disk Info ---
  if (data.disks?.length) {
    console.log('💾 Disk Info:');
    data.disks.forEach((disk: DiskInfo) => {
      console.log(`- ${disk.name}: ${disk.usedGB} GB used / ${disk.totalGB} GB total (${disk.freeGB} GB free)`);
    });
  }

  // --- Log Process Info ---
  if (data.processes?.length) {
    console.log('\n⚙️ Running Processes:');
    data.processes.forEach((proc: ProcessInfo) => {
      console.log(`- PID ${proc.pid} | ${proc.name} | CPU: ${proc.cpuTime} | RAM: ${proc.memoryMB} MB`);
    });
  }

  // --- Log Sensor Info ---
  if (data.sensors?.length) {
    console.log('\n🌡️ Sensor Readings:');
    data.sensors.forEach((sensor: SensorInfo) => {
      console.log(`- ${sensor.name}: ${sensor.value}`);
    });
  }

  return NextResponse.json({ status: 'success' });
}
