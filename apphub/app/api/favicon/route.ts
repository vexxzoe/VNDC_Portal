import { NextRequest, NextResponse } from "next/server";
import { fetchFavicon } from "@/lib/favicon";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param is required" }, { status: 400 });
  }

  const iconUrl = await fetchFavicon(url);
  return NextResponse.json({ iconUrl });
}
