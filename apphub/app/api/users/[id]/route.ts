import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSelf = session.user.id === id;
    const isAdmin = session.user.role === "admin";

    // Only admin can edit others; anyone can edit their own profile
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, email, password, role } = body;

    // Self cannot change their own role
    if (isSelf && role !== undefined && role !== existing.role) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }
    if (role !== undefined && !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Role must be admin or member" }, { status: 400 });
    }
    if (password !== undefined && password !== "" && password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim() || null;
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (role !== undefined && !isSelf) data.role = role;
    if (password && password.length >= 6) data.password = await bcrypt.hash(password, 10);

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    console.error("[PATCH /api/users/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // AppHistory cascades via schema onDelete: Cascade
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/users/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
