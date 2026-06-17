import cron from "node-cron";
import { runHealthCheckAll } from "@/lib/healthCheck";

let initialized = false;

export function initCron() {
  // Guard against double-init in dev (Next.js hot-reload can call register() twice)
  if (initialized) return;
  initialized = true;

  console.log("[Cron] Health check scheduler started — runs every 5 minutes");

  // Run immediately on startup so we have fresh data right away
  runHealthCheckAll().catch((e) => console.error("[Cron] Initial health check failed:", e));

  // Schedule every 5 minutes: */5 * * * *
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Cron] Running scheduled health check…");
    try {
      const { checked, up, down } = await runHealthCheckAll();
      console.log(`[Cron] Done — ${checked} checked, ${up} up, ${down} down`);
    } catch (e) {
      console.error("[Cron] Health check error:", e);
    }
  });
}
