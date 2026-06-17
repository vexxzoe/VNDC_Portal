import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

function adminOnly(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await db.notificationSetting.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { enabled, webhookUrl, emailTo } = body;

    const setting = await db.notificationSetting.update({
      where: { id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(webhookUrl !== undefined && { webhookUrl: webhookUrl.trim() }),
        ...(emailTo !== undefined && { emailTo: emailTo.trim() }),
      },
    });
    return NextResponse.json({ setting });
  } catch (e) {
    console.error("[PATCH /api/notifications/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await db.notificationSetting.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.notificationSetting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/notifications/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
