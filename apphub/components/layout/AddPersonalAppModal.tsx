"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconField } from "@/components/ui/icon-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddPersonalAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AddPersonalAppModal({ open, onOpenChange, onSaved }: AddPersonalAppModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() { setName(""); setUrl(""); setDescription(""); setIcon(""); setError(null); }
  function handleClose(v: boolean) { if (!v) reset(); onOpenChange(v); }

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Tên là bắt buộc"); return; }
    if (!url.trim()) { setError("Địa chỉ URL là bắt buộc"); return; }
    if (!url.startsWith("http")) { setError("Địa chỉ URL phải bắt đầu bằng http"); return; }

    setSaving(true);
    const res = await fetch("/api/apps/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description, icon }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Lưu thất bại"); return; }
    toast.success("Đã thêm vào ứng dụng cá nhân của bạn!");
    reset();
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Thêm ứng dụng cá nhân</DialogTitle></DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="pa-name">Tên *</Label>
            <Input id="pa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên ứng dụng" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pa-url">Địa chỉ URL *</Label>
            <Input id="pa-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pa-desc">Mô tả</Label>
            <Textarea id="pa-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn..." rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label>Biểu tượng</Label>
            <IconField value={icon} onChange={setIcon} appUrl={url} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Thêm ứng dụng"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
