import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Make sure the app exists
    const app = await db.app.findUnique({ where: { id }, select: { id: true } });
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Record the open event
    await db.appHistory.create({ data: { appId: id, userId } });

    // Keep only the latest 50 history records per user
    const oldest = await db.appHistory.findMany({
      where: { userId },
      orderBy: { openedAt: "desc" },
      skip: 50,
      select: { id: true },
    });

    if (oldest.length > 0) {
      await db.appHistory.deleteMany({
        where: { id: { in: oldest.map((r) => r.id) } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/apps/[id]/open]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
