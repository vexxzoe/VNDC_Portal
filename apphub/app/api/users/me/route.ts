import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, password } = body;

    if (password !== undefined && password !== "" && password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim() || null;
    if (password && password.length >= 6) data.password = await bcrypt.hash(password, 10);

    const user = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (e) {
    console.error("[PATCH /api/users/me]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
