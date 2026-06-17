import { NextResponse } from "next/server";
import { runHealthCheckAll } from "@/lib/healthCheck";

export const dynamic = "force-dynamic";

export async function GET() {
  const { checked, up, down, results } = await runHealthCheckAll();

  return NextResponse.json({
    checked,
    up,
    down,
    unknown: checked - up - down,
    results,
  });
}
