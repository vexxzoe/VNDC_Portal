"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { IconField } from "@/components/ui/icon-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { App, Category } from "@/lib/types";

interface AppFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: App | null;
  categories: Category[];
  onSaved: () => void;
}

interface FormState {
  name: string;
  url: string;
  description: string;
  icon: string;
  categoryId: string;
  isPinned: boolean;
  order: string;
}

const EMPTY: FormState = {
  name: "", url: "", description: "", icon: "",
  categoryId: "", isPinned: false, order: "0",
};

export function AppFormModal({ open, onOpenChange, app, categories, onSaved }: AppFormModalProps) {
  const isEdit = !!app;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(app ? {
        name: app.name, url: app.url,
        description: app.description ?? "", icon: app.icon ?? "",
        categoryId: app.categoryId, isPinned: app.isPinned, order: String(app.order),
      } : EMPTY);
    }
  }, [open, app]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim()) { setError("Tên là bắt buộc"); return; }
    if (!form.url.trim()) { setError("Địa chỉ URL là bắt buộc"); return; }
    if (!form.url.startsWith("http")) { setError("Địa chỉ URL phải bắt đầu bằng http"); return; }
    if (!form.categoryId) { setError("Danh mục là bắt buộc"); return; }

    setSaving(true);
    const res = await fetch(isEdit ? `/api/apps/${app!.id}` : "/api/apps", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(), url: form.url.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        categoryId: form.categoryId, isPinned: form.isPinned,
        order: parseInt(form.order, 10) || 0,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Lưu ứng dụng thất bại"); return; }
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa ứng dụng" : "Thêm ứng dụng mới"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="app-name">Tên *</Label>
            <Input id="app-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="GitLab" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="app-url">Địa chỉ URL *</Label>
            <Input
              id="app-url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              onBlur={() => { if (form.url.trim() && !form.icon.trim()) {/* auto-fetch handled by IconField fetch tab */} }}
              placeholder="https://gitlab.internal"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="app-desc">Mô tả</Label>
            <Textarea id="app-desc" value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn về ứng dụng..." rows={2} />
          </div>

          {/* Icon — 3-mode field */}
          <div className="grid gap-1.5">
            <Label>Biểu tượng</Label>
            <IconField
              value={form.icon}
              onChange={(url) => set("icon", url)}
              appUrl={form.url}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Danh mục *</Label>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn danh mục..." /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="app-order">Thứ tự</Label>
              <Input id="app-order" type="number" value={form.order}
                onChange={(e) => set("order", e.target.value)} min={0} />
            </div>
            <div className="grid gap-1.5">
              <Label>Ghim</Label>
              <div className="flex h-8 items-center">
                <Switch checked={form.isPinned} onCheckedChange={(v) => set("isPinned", v)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
