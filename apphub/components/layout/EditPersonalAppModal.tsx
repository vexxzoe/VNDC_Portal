"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconField } from "@/components/ui/icon-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalApp {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
}

interface EditPersonalAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: PersonalApp | null;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EditPersonalAppModal({ open, onOpenChange, app, onSaved, onDeleted }: EditPersonalAppModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && app) {
      setName(app.name); setUrl(app.url);
      setDescription(app.description ?? ""); setIcon(app.icon ?? "");
      setError(null);
    }
  }, [open, app]);

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Tên là bắt buộc"); return; }
    if (!url.trim()) { setError("Địa chỉ URL là bắt buộc"); return; }
    if (!url.startsWith("http")) { setError("Địa chỉ URL phải bắt đầu bằng http"); return; }
    if (!app) return;

    setSaving(true);
    const res = await fetch(`/api/apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description: description || null, icon: icon || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Lưu thất bại"); return; }
    toast.success("Đã cập nhật ứng dụng");
    onOpenChange(false);
    onSaved();
  }

  async function handleDelete() {
    if (!app || !confirm(`Xóa "${app.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast.success("Đã xóa ứng dụng"); onOpenChange(false); onDeleted(); }
    else { const d = await res.json(); toast.error(d.error ?? "Xóa thất bại"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Chỉnh sửa ứng dụng cá nhân</DialogTitle></DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="ep-name">Tên *</Label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ep-url">Địa chỉ URL *</Label>
            <Input id="ep-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ep-desc">Mô tả</Label>
            <Textarea id="ep-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label>Biểu tượng</Label>
            <IconField value={icon} onChange={setIcon} appUrl={url} />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <Button variant="outline" onClick={handleDelete} disabled={deleting || saving}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive">
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || deleting}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
