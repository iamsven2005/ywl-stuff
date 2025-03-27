import { NextRequest, NextResponse } from 'next/server';

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

  // Get live sensor data from LibreHardwareMonitor
  const res = await fetch('http://192.168.1.102:8080/data.json');
  const sensorData = await res.json();

  console.log('[Disk Info Received]');
  console.log(JSON.stringify(data, null, 2));

  console.log('[Sensor Info]');
  const rootNode = sensorData?.Children?.[0];
  if (rootNode) {
    extractSensors(rootNode);
  } else {
    console.log('No sensor data available');
  }

  return NextResponse.json({ status: 'success' });
}
