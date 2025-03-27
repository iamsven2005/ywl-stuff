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

type Sensor = {
  Text: string;
  Value?: string;
  Min?: string;
  Max?: string;
  Children?: Sensor[];
};

function extractSensors(node: Sensor, depth = 0): void {
  const indent = '  '.repeat(depth);
  const hasValue = node.Value !== '' && node.Value !== undefined;

  if (hasValue) {
    console.log(`${indent}- ${node.Text}: ${node.Value}`);
  }

  if (node.Children && node.Children.length > 0) {
    node.Children.forEach(child => extractSensors(child, depth + 1));
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  console.log(`\n===== Device Info from ${data.hostname} at ${data.timestamp} =====`);

  // --- Log Disk Info ---
  if (data.disks?.length) {
    console.log('📦 Disk Info:');
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

  // --- Fetch & Log Sensor Info ---
  try {
    const res = await fetch('http://192.168.1.102:8080/data.json');
    const sensorData = await res.json();

    console.log('\n🌡️ Sensor Info:');
    const rootNode = sensorData?.Children?.[0];
    if (rootNode) {
      extractSensors(rootNode);
    } else {
      console.log('No sensor data found.');
    }
  } catch (err) {
    console.error('Failed to fetch sensor data:', err);
  }

  return NextResponse.json({ status: 'success' });
}
