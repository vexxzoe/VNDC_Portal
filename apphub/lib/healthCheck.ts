import { db } from "@/lib/db";
import { sendDownAlert } from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Check a single URL
// ---------------------------------------------------------------------------
export async function checkAppHealth(url: string): Promise<"up" | "down"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "manual" });
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Run health checks for all apps concurrently
// ---------------------------------------------------------------------------
export async function runHealthCheckAll(): Promise<{
  checked: number;
  up: number;
  down: number;
  results: { name: string; url: string; status: string; lastChecked: Date }[];
}> {
  // Fetch current status alongside id/name/url so we can detect transitions
  const apps = await db.app.findMany({
    select: { id: true, name: true, url: true, status: true, previousStatus: true },
  });

  const now = new Date();

  const settled = await Promise.allSettled(
    apps.map(async (app) => {
      const newStatus = await checkAppHealth(app.url);

      // Transition detection: only alert when crossing from "up" → "down"
      const wasUp = app.status === "up";
      const isNowDown = newStatus === "down";
      if (wasUp && isNowDown) {
        // Fire-and-forget — never let notification errors break the health check
        sendDownAlert({ name: app.name, url: app.url }).catch(() => {});
      }

      await db.app.update({
        where: { id: app.id },
        data: {
          status: newStatus,
          previousStatus: app.status, // store what it was before this check
          lastChecked: now,
        },
      });

      return { name: app.name, url: app.url, status: newStatus, lastChecked: now };
    })
  );

  const results: { name: string; url: string; status: string; lastChecked: Date }[] = [];
  let up = 0;
  let down = 0;

  for (const r of settled) {
    if (r.status === "fulfilled") {
      results.push(r.value);
      if (r.value.status === "up") up++;
      else down++;
    }
  }

  const lines = results.map((r) => `  ${r.name}: ${r.status}`).join("\n");
  console.log(`[HealthCheck] ${up} up / ${down} down\n${lines}`);

  return { checked: apps.length, up, down, results };
}
