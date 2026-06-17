import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { apps: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, slug, icon, order } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!slug?.trim()) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

  try {
    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        icon: icon?.trim() || null,
        order: order ?? 0,
      },
      include: { _count: { select: { apps: true } } },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
