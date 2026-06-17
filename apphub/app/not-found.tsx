import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Không tìm thấy trang",
};

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-6xl font-black text-muted-foreground/20" aria-hidden="true">
        404
      </div>
      <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="max-w-md text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
