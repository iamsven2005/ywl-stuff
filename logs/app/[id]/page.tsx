
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function Page({ params }: { params: { id: string } }) {
  const headersList = headers();

  const ip =
    (await headersList).get("x-forwarded-for")?.split(",")[0].trim() || // proxy/IP header
    (await headersList).get("x-real-ip") ||
    "unknown";

  const timestamp = new Date(); // current server-side time

  await db.message.create({
    data: {
      groupId: 1,
      senderId: 1,
      content: `WP bot scan at ${timestamp.toISOString()} from IP ${ip} with path ${params.id}`,
    },
  });

  return null;
}
