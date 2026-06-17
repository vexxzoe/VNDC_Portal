import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", apps: [] }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch recent history rows with full app+category data.
    // SQLite doesn't support DISTINCT ON, so we fetch and deduplicate in app code.
    const history = await db.appHistory.findMany({
      where: { userId },
      orderBy: { openedAt: "desc" },
      include: {
        app: {
          include: { category: true },
        },
      },
      take: 100, // enough to surface 5 distinct apps even with many duplicates
    });

    // Keep only the first (most recent) occurrence of each appId
    const seen = new Set<string>();
    const recentApps: Array<typeof history[0]["app"] & { openedAt: Date }> = [];

    for (const row of history) {
      if (!seen.has(row.appId)) {
        seen.add(row.appId);
        recentApps.push({ ...row.app, openedAt: row.openedAt });
      }
      if (recentApps.length === 5) break;
    }

    return NextResponse.json({ apps: recentApps });
  } catch (error) {
    console.error("[/api/apps/recent]", error);
    return NextResponse.json(
      { error: "Internal server error", apps: [] },
      { status: 500 }
    );
  }
}
