import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AppInfo {
  name: string;
  url: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Slack
// ---------------------------------------------------------------------------
export async function sendSlackNotification(
  webhookUrl: string,
  app: AppInfo,
  isTest = false
): Promise<void> {
  const text = isTest
    ? "✅ *AppHub Test Notification* — Slack is connected!"
    : `🔴 *App Offline Alert*\n*${app.name}* is currently DOWN\n<${app.url}|${app.url}>`;

  const body = {
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Detected at ${new Date().toUTCString()} by AppHub Health Check`,
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook returned ${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    const missing = [!host && "SMTP_HOST", !user && "SMTP_USER", !pass && "SMTP_PASS"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `SMTP not configured — missing: ${missing}. Add these to .env.local and restart the server.`
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // allow self-signed certs
  });
}

export async function sendEmailNotification(
  emailTo: string,
  app: AppInfo,
  isTest = false
): Promise<void> {
  const transport = createTransport();
  // Verify SMTP connection before attempting to send — gives a clear error message
  await transport.verify();

  const from = process.env.SMTP_FROM?.trim() || "AppHub <noreply@apphub.internal>";
  const dashboardUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const subject = isTest
    ? "✅ [AppHub] Test Notification"
    : `🔴 [AppHub] ${app.name} is DOWN`;

  const html = isTest
    ? `
      <h2>✅ AppHub Test Notification</h2>
      <p>This is a test notification from AppHub. Your email channel is configured correctly.</p>
      <hr/>
      <p style="color:#666;font-size:12px">This is an automated message from AppHub.</p>
    `
    : `
      <h2>🔴 App Offline Alert</h2>
      <p><strong>${app.name}</strong> is currently <strong>DOWN</strong>.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">URL</td><td><a href="${app.url}">${app.url}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Detected at</td><td>${new Date().toUTCString()}</td></tr>
      </table>
      <a href="${dashboardUrl}" style="display:inline-block;padding:8px 16px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none">Open AppHub Dashboard</a>
      <hr style="margin:24px 0"/>
      <p style="color:#666;font-size:12px">This is an automated alert from AppHub. Do not reply to this email.</p>
    `;

  await transport.sendMail({ from, to: emailTo, subject, html });
}

// ---------------------------------------------------------------------------
// Main: send down alert to all enabled channels
// ---------------------------------------------------------------------------
export async function sendDownAlert(app: AppInfo): Promise<void> {
  let settings: Awaited<ReturnType<typeof db.notificationSetting.findMany>>;
  try {
    settings = await db.notificationSetting.findMany({ where: { enabled: true } });
  } catch (e) {
    console.error("[Notify] Failed to fetch notification settings:", e);
    return;
  }

  const results: string[] = [];

  await Promise.allSettled(
    settings.map(async (s) => {
      try {
        if (s.type === "slack" && s.webhookUrl) {
          await sendSlackNotification(s.webhookUrl, app);
          results.push("Slack sent");
        } else if (s.type === "email" && s.emailTo) {
          await sendEmailNotification(s.emailTo, app);
          results.push("Email sent");
        }
      } catch (e) {
        console.error(`[Notify] Failed to send ${s.type}:`, e);
      }
    })
  );

  if (results.length > 0) {
    console.log(`[Notify] ${results.join(" | ")} — app: ${app.name}`);
  }
}
