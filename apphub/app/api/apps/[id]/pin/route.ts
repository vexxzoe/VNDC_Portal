import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find current state
  const existing = await db.app.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Toggle isPinned
  const updated = await db.app.update({
    where: { id },
    data: { isPinned: !existing.isPinned },
    include: { category: true },
  });

  return NextResponse.json({ app: updated });
}
