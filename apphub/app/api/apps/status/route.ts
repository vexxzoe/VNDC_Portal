import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { user?: { id?: string } } | null)?.user?.id;

    // Return lightweight status-only rows — same visibility filter as main endpoint
    const statuses = await db.app.findMany({
      where: {
        OR: [
          { visibility: "shared" },
          ...(userId ? [{ visibility: "personal", ownerId: userId }] : []),
        ],
      },
      select: { id: true, status: true, lastChecked: true },
    });

    return NextResponse.json({ statuses });
  } catch (e) {
    console.error("[GET /api/apps/status]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
