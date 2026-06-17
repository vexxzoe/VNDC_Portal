import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, slug, icon, order } = body;

  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  try {
    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim().toLowerCase() }),
        ...(icon !== undefined && { icon: icon?.trim() || null }),
        ...(order !== undefined && { order }),
      },
      include: { _count: { select: { apps: true } } },
    });
    return NextResponse.json({ category });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { apps: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (existing._count.apps > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this category still has ${existing._count.apps} app(s). Remove all apps first.` },
      { status: 400 }
    );
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
