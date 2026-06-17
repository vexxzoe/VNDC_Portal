"use client";

import { Loader2, Link2, Upload, Wand2, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "url" | "upload" | "fetch";

interface IconFieldProps {
  value: string;
  onChange: (url: string) => void;
  appUrl?: string;
  className?: string;
}

const ACCEPTED = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_MB = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export function IconField({ value, onChange, appUrl, className }: IconFieldProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFieldError(null);
    if (!file.type || !ACCEPTED.split(",").includes(file.type)) {
      setFieldError("Chỉ chấp nhận PNG, JPEG, WebP, SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setFieldError(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("icon", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setFieldError(data.error ?? "Tải lên thất bại"); return; }
      onChange(data.url);
      toast.success("Đã tải lên biểu tượng!");
    } catch {
      setFieldError("Tải lên thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAutoFetch() {
    if (!appUrl?.trim() || !appUrl.startsWith("http")) {
      toast.warning("Nhập địa chỉ URL ứng dụng trước, rồi tự động lấy icon.");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(`/api/favicon?url=${encodeURIComponent(appUrl.trim())}`);
      const data = await res.json();
      if (data.iconUrl) { onChange(data.iconUrl); toast.success("Đã lấy icon thành công!"); }
      else toast.warning("Không thể lấy icon", { description: "Vui lòng nhập thủ công." });
    } catch { toast.error("Lấy icon thất bại"); }
    finally { setFetching(false); }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const preview = value.startsWith("http") || value.startsWith("/") ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={value} alt="Xem trước biểu tượng" className="size-9 shrink-0 rounded-lg bg-muted object-contain p-0.5" />
  ) : (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">?</div>
  );

  const TABS: { id: Mode; icon: React.ElementType; label: string }[] = [
    { id: "url",    icon: Link2,  label: "URL" },
    { id: "upload", icon: Upload, label: "Tải lên" },
    { id: "fetch",  icon: Wand2,  label: "Tự động lấy" },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mode switcher */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} type="button"
            onClick={() => { setMode(id); setFieldError(null); }}
            className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="size-3.5" />{label}
          </button>
        ))}
      </div>

      {mode === "url" && (
        <div className="flex items-center gap-2">
          {preview}
          <div className="relative flex-1">
            <Input value={value} onChange={(e) => onChange(e.target.value)}
              placeholder="https://cdn.simpleicons.org/gitlab" className="pr-7" />
            {value && (
              <button type="button" onClick={() => onChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Xóa đường dẫn icon">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-2">
          <div onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label="Tải lên ảnh biểu tượng"
            className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
              uploading && "pointer-events-none opacity-60")}>
            <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {uploading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <Upload className="size-6 text-muted-foreground" />}
            <p className="text-sm text-muted-foreground">
              {uploading ? "Đang tải lên..." : "Kéo thả hoặc nhấn để chọn file"}
            </p>
            <p className="text-xs text-muted-foreground/60">PNG, JPEG, WebP, SVG · tối đa {MAX_MB} MB</p>
          </div>
          {value && (
            <div className="flex items-center gap-2">
              {preview}
              <span className="flex-1 truncate text-xs text-muted-foreground">{value}</span>
              <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "fetch" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {preview}
            <Button type="button" variant="outline" size="sm"
              disabled={fetching || !appUrl?.trim()}
              onClick={handleAutoFetch} className="gap-1.5">
              {fetching ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              {fetching ? "Đang lấy..." : "Tự động lấy"}
            </Button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {!appUrl?.trim() && (
            <p className="text-xs text-muted-foreground">Nhập địa chỉ URL ứng dụng trước, rồi tự động lấy icon.</p>
          )}
        </div>
      )}

      {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
    </div>
  );
}
