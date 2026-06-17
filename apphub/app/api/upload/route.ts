import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createId } from "@paralleldrive/cuid2";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "icons");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("icon") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed." },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 2 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Save with unique filename
    const filename = `${createId()}.${ext}`;
    const dest = join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    const url = `/uploads/icons/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/upload]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
