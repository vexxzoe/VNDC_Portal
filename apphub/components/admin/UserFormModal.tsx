"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  currentUserId: string; // logged-in admin's own id
  onSaved: () => void;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: string;
}

const EMPTY: FormState = { name: "", email: "", password: "", role: "member" };

export function UserFormModal({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSaved,
}: UserFormModalProps) {
  const isEdit = !!user;
  const isSelf = user?.id === currentUserId;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setShowPw(false);
      setForm(
        user
          ? { name: user.name ?? "", email: user.email, password: "", role: user.role }
          : EMPTY
      );
    }
  }, [open, user]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!isEdit && form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password && form.password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setSaving(true);
    const payload: Record<string, string> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };
    if (!isEdit) payload.password = form.password;
    else if (form.password) payload.password = form.password;

    const res = await fetch(
      isEdit ? `/api/users/${user!.id}` : "/api/users",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save user"); return; }
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="u-name">Name *</Label>
            <Input id="u-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alice" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="u-email">Email *</Label>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="alice@internal.com" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="u-pw">{isEdit ? "New Password" : "Password *"}</Label>
            <div className="relative">
              <Input
                id="u-pw"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current" : "Min 6 characters"}
                className="pr-9"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {isEdit && <p className="text-xs text-muted-foreground">Leave blank to keep current password.</p>}
          </div>

          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v ?? "member")}
              disabled={isSelf} // cannot change own role
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
