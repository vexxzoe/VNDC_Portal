import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function adminOnly(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session as { user?: { role?: string } } | null)?.user?.role === "admin";
}

function isValidEmail(str: string) {
  return str.split(",").every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const settings = await db.notificationSetting.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("[GET /api/notifications]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { type, webhookUrl, emailTo } = body;

    if (!["slack", "email"].includes(type)) {
      return NextResponse.json({ error: "Type must be slack or email" }, { status: 400 });
    }
    if (type === "slack") {
      if (!webhookUrl?.trim()) return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
      if (!webhookUrl.startsWith("https://hooks.slack.com")) {
        return NextResponse.json({ error: "Webhook URL must start with https://hooks.slack.com" }, { status: 400 });
      }
    }
    if (type === "email") {
      if (!emailTo?.trim()) return NextResponse.json({ error: "Email address is required" }, { status: 400 });
      if (!isValidEmail(emailTo)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const setting = await db.notificationSetting.create({
      data: {
        type,
        webhookUrl: type === "slack" ? webhookUrl.trim() : null,
        emailTo: type === "email" ? emailTo.trim() : null,
        enabled: true,
      },
    });
    return NextResponse.json({ setting }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/notifications]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
