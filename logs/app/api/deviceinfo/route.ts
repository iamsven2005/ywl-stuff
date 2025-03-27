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

  // Get client IP
// Get client IP and clean it if it's IPv6-mapped IPv4 (::ffff:192.168.1.xxx)
const forwarded = req.headers.get("x-forwarded-for");
let ip =
  forwarded?.split(",")[0]?.trim() ||
  (req as any).socket?.remoteAddress ||
  "127.0.0.1";

// Sanitize IPv6-mapped IPv4 address (::ffff:192.168.x.x → 192.168.x.x)
if (ip.startsWith("::ffff:")) {
  ip = ip.replace("::ffff:", "");
}


  console.log(`\n===== Device Info from ${data.hostname} at ${data.timestamp} =====`);
  console.log(`🌐 Client IP: ${ip}`);

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
    const sensorUrl = `http://${ip}:8080/data.json`;
    const res = await fetch(sensorUrl);
    const sensorData = await res.json();

    console.log('\n🌡️ Sensor Info:');
    const rootNode = sensorData?.Children?.[0];
    if (rootNode) {
      extractSensors(rootNode);
    } else {
      console.log('No sensor data found.');
    }
  } catch (err) {
    console.error(`Failed to fetch sensor data from http://${ip}:8080/data.json`, err);
  }

  return NextResponse.json({ status: 'success' });
}
