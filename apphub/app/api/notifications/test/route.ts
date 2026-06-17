import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSlackNotification, sendEmailNotification } from "@/lib/notifications";

function adminOnly(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const setting = await db.notificationSetting.findUnique({ where: { id } });
    if (!setting) return NextResponse.json({ error: "Notification setting not found" }, { status: 404 });

    const testApp = { name: "AppHub Test", url: process.env.NEXTAUTH_URL ?? "http://localhost:3000" };

    if (setting.type === "slack" && setting.webhookUrl) {
      await sendSlackNotification(setting.webhookUrl, testApp, true);
    } else if (setting.type === "email" && setting.emailTo) {
      // Early config check — return 400 (not 500) when SMTP is simply not configured
      const smtpMissing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter(
        (k) => !process.env[k]?.trim()
      );
      if (smtpMissing.length > 0) {
        return NextResponse.json(
          {
            error: `SMTP not configured. Add ${smtpMissing.join(", ")} to .env.local and restart the server.`,
          },
          { status: 400 }
        );
      }
      await sendEmailNotification(setting.emailTo, testApp, true);
    } else {
      return NextResponse.json({ error: "Setting has no valid destination configured" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send test notification";
    console.error("[POST /api/notifications/test]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
