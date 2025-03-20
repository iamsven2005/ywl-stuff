import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Perform a simple database query to check connectivity
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ healthy: true }, { status: 200 });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json({ healthy: false, error: "Database connection failed." }, { status: 500 });
  }
}
