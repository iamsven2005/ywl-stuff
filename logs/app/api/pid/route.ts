import { NextRequest, NextResponse } from 'next/server';

type ProcessInfo = {
  pid: number;
  name: string;
  cpuTime: number;
  memoryMB: number;
};

export async function POST(req: NextRequest) {
  const data = await req.json();

  console.log(`[PID Info from ${data.hostname} at ${data.timestamp}]`);
  data.processes.forEach((proc: ProcessInfo) => {
    console.log(`- PID ${proc.pid} | ${proc.name} | CPU: ${proc.cpuTime} | RAM: ${proc.memoryMB} MB`);
  });

  return NextResponse.json({ status: 'logged' });
}
