"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(session?.user?.name ?? ""); setPassword(""); setError(null); setShowPw(false); }
  }, [open, session]);

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Họ tên là bắt buộc"); return; }
    if (password && password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    setSaving(true);
    const payload: Record<string, string> = { name: name.trim() };
    if (password) payload.password = password;
    const res = await fetch("/api/users/me", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Lưu thất bại"); return; }
    await updateSession({ name: data.user.name });
    toast.success("Đã cập nhật hồ sơ");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Hồ sơ cá nhân</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={session?.user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Họ tên *</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-pw">Mật khẩu mới</Label>
            <div className="relative">
              <Input id="profile-pw" type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Để trống nếu không muốn đổi" className="pr-9" />
              <button type="button" tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw((v) => !v)}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự. Để trống nếu không muốn đổi.</p>
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
