import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

function getSessionUser(session: Awaited<ReturnType<typeof getServerSession>>) {
  const s = session as { user?: { id?: string; role?: string } } | null;
  return { id: s?.user?.id, role: s?.user?.role ?? "member" };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const { id: userId, role } = getSessionUser(session);

    const existing = await db.app.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "App not found" }, { status: 404 });

    // Members can only edit their own personal apps
    if (role !== "admin") {
      if (existing.visibility !== "personal" || existing.ownerId !== userId) {
        return NextResponse.json({ error: "You can only edit your own personal apps" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { name, url, description, icon, categoryId, isPinned, order, status } = body;

    if (url !== undefined && !url.startsWith("http")) {
      return NextResponse.json({ error: "URL must start with http" }, { status: 400 });
    }

    const app = await db.app.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(url !== undefined && { url: url.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon: icon?.trim() || null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isPinned !== undefined && { isPinned }),
        ...(order !== undefined && { order }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ app });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "An app with this URL already exists" }, { status: 409 });
    }
    console.error("[PATCH /api/apps/[id]]", e);
    return NextResponse.json({ error: "Failed to update app" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const { id: userId, role } = getSessionUser(session);

    const existing = await db.app.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "App not found" }, { status: 404 });

    // Members can only delete their own personal apps
    if (role !== "admin") {
      if (existing.visibility !== "personal" || existing.ownerId !== userId) {
        return NextResponse.json({ error: "You can only delete your own personal apps" }, { status: 403 });
      }
    }

    await db.app.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/apps/[id]]", e);
    return NextResponse.json({ error: "Failed to delete app" }, { status: 500 });
  }
}
