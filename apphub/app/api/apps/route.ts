import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { user?: { id?: string } } | null)?.user?.id;
    const userRole = (session as { user?: { role?: string } } | null)?.user?.role ?? "member";

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    // ?admin=true lets admins see all apps including personal ones from all users
    const adminView = searchParams.get("admin") === "true" && userRole === "admin";

    const apps = await db.app.findMany({
      where: {
        // Admin view: all apps. Regular view: shared + own personal only
        ...(adminView ? {} : {
          OR: [
            { visibility: "shared" },
            ...(userId ? [{ visibility: "personal", ownerId: userId }] : []),
          ],
        }),
        ...(category ? { category: { slug: category } } : {}),
        ...(search
          ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
          : {}),
      },
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ isPinned: "desc" }, { order: "asc" }],
    });

    return NextResponse.json({ apps });
  } catch (e) {
    console.error("[GET /api/apps]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { user?: { id?: string; role?: string } } | null)?.user?.id;
    const userRole = (session as { user?: { role?: string } } | null)?.user?.role ?? "member";

    const body = await request.json();
    const { name, url, description, icon, categoryId, isPinned, order, visibility } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!url?.trim()) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!url.startsWith("http")) return NextResponse.json({ error: "URL must start with http" }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    // Members can only create personal apps
    if (userRole !== "admin" && visibility === "shared") {
      return NextResponse.json({ error: "Members can only create personal apps" }, { status: 403 });
    }

    const resolvedVisibility = userRole === "admin" ? (visibility ?? "shared") : "personal";
    const resolvedOwnerId = resolvedVisibility === "personal" ? (userId ?? null) : null;

    const app = await db.app.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        categoryId,
        isPinned: isPinned ?? false,
        order: order ?? 0,
        visibility: resolvedVisibility,
        ownerId: resolvedOwnerId,
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
    console.error("[POST /api/apps]", e);
    return NextResponse.json({ error: "Failed to create app" }, { status: 500 });
  }
}
