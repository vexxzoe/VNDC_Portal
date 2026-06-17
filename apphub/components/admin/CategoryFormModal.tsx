"use client";

import {
  Code2, Server, Users, DollarSign, Megaphone,
  Globe, Database, BarChart, Settings, Shield,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconField } from "@/components/ui/icon-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSaved: () => void;
}

interface FormState {
  name: string;
  slug: string;
  icon: string;
  order: string;
}

const EMPTY: FormState = { name: "", slug: "", icon: "", order: "0" };

// Suggested icon options with live Lucide preview
const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "code-2",      label: "Lập trình",  Icon: Code2 },
  { value: "server",      label: "Máy chủ",    Icon: Server },
  { value: "users",       label: "Người dùng", Icon: Users },
  { value: "dollar-sign", label: "Tài chính",  Icon: DollarSign },
  { value: "megaphone",   label: "Marketing",  Icon: Megaphone },
  { value: "globe",       label: "Mạng",       Icon: Globe },
  { value: "database",    label: "Cơ sở dữ liệu", Icon: Database },
  { value: "bar-chart",   label: "Thống kê",   Icon: BarChart },
  { value: "settings",    label: "Cài đặt",    Icon: Settings },
  { value: "shield",      label: "Bảo mật",    Icon: Shield },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormModalProps) {
  const isEdit = !!category;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugLocked, setSlugLocked] = useState(false); // true once user edits slug manually
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setSlugLocked(isEdit);
      setForm(
        category
          ? { name: category.name, slug: category.slug, icon: category.icon ?? "", order: String(category.order) }
          : EMPTY
      );
    }
  }, [open, category, isEdit]);

  function setField(field: keyof FormState, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-generate slug from name unless user has manually edited it
      if (field === "name" && !slugLocked) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  function handleSlugChange(v: string) {
    setSlugLocked(true);
    setField("slug", v);
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim()) { setError("Tên là bắt buộc"); return; }
    if (!form.slug.trim()) { setError("Slug là bắt buộc"); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim() || null,
      order: parseInt(form.order, 10) || 0,
    };

    const res = await fetch(
      isEdit ? `/api/categories/${category!.id}` : "/api/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Lưu danh mục thất bại"); return; }
    onSaved();
    onOpenChange(false);
  }

  // Find current icon component for preview — handle both Lucide names and image URLs
  const isIconUrl = form.icon.startsWith("/") || form.icon.startsWith("http");
  const selectedIconObj = !isIconUrl ? ICON_OPTIONS.find((o) => o.value === form.icon) : null;
  const PreviewIcon = selectedIconObj?.Icon ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-name">Tên *</Label>
            <Input id="cat-name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Development" />
          </div>

          {/* Slug */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input id="cat-slug" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="development" />
            <p className="text-xs text-muted-foreground">Tự động tạo từ tên. Có thể chỉnh sửa thủ công.</p>
          </div>

          {/* Icon picker */}
          <div className="grid gap-1.5">
            <Label>Biểu tượng</Label>
            <div className="flex items-center gap-2 mb-2">
              {isIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.icon} alt="" className="size-8 rounded object-cover bg-muted" />
              ) : PreviewIcon ? (
                <span className="flex size-8 items-center justify-center rounded bg-primary/10">
                  <PreviewIcon className="size-4 text-primary" />
                </span>
              ) : (
                <span className="flex size-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">?</span>
              )}
              <Input
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
                placeholder="code-2"
                className="flex-1"
              />
            </div>
            {/* Suggested icon grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {ICON_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setField("icon", value)}
                  className={`flex flex-col items-center gap-0.5 rounded-md border p-1.5 text-xs transition-colors hover:bg-accent ${
                    form.icon === value ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="truncate w-full text-center text-[10px]">{label}</span>
                </button>
              ))}
            </div>

            {/* Image upload option */}
            <div className="pt-1">
              <p className="mb-1.5 text-xs text-muted-foreground">Hoặc tải lên ảnh biểu tượng:</p>
              <IconField
                value={form.icon.startsWith("/") || form.icon.startsWith("http") ? form.icon : ""}
                onChange={(url) => setField("icon", url)}
              />
            </div>
          </div>

          {/* Order */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-order">Thứ tự</Label>
            <Input id="cat-order" type="number" value={form.order} onChange={(e) => setField("order", e.target.value)} min={0} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
