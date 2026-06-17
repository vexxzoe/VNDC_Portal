import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, extname, basename } from "path";

// Must match UPLOAD_DIR in app/api/upload/route.ts
const UPLOAD_DIR = join(process.cwd(), "uploads", "icons");

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg":  "image/svg+xml",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitise — reject any path traversal attempts
  const safe = basename(filename);
  if (safe !== filename || safe.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = extname(safe).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(join(UPLOAD_DIR, safe));
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        // Cache for 1 year — filenames are unique cuid2 IDs so they never change
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
