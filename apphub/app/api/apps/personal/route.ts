import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchFavicon } from "@/lib/favicon";

const PERSONAL_CATEGORY = { name: "Personal", slug: "personal", icon: "user" };

async function getOrCreatePersonalCategory() {
  const existing = await db.category.findUnique({ where: { slug: PERSONAL_CATEGORY.slug } });
  if (existing) return existing;
  return db.category.create({
    data: { ...PERSONAL_CATEGORY, order: 999 },
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { user?: { id?: string } } | null)?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, url, description } = body;
    let { icon } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!url.startsWith("http")) return NextResponse.json({ error: "URL must start with http" }, { status: 400 });

    // Auto-fetch favicon if icon not supplied
    if (!icon?.trim() && url.startsWith("http")) {
      icon = await fetchFavicon(url).catch(() => null);
    }

    const category = await getOrCreatePersonalCategory();

    const app = await db.app.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        categoryId: category.id,
        visibility: "personal",
        ownerId: userId,
        isPinned: false,
        order: 0,
      },
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ app }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "An app with this URL already exists" }, { status: 409 });
    }
    console.error("[POST /api/apps/personal]", e);
    return NextResponse.json({ error: "Failed to create personal app" }, { status: 500 });
  }
}
