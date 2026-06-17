"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl" aria-hidden="true">⚠️</div>
      <h1 className="text-2xl font-bold">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-muted-foreground">
        {error.message || "Đã xảy ra lỗi không mong muốn."}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground/60">
          Mã lỗi: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
