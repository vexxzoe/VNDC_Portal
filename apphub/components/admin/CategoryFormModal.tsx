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
  { value: "code-2",      label: "Code",       Icon: Code2 },
  { value: "server",      label: "Server",     Icon: Server },
  { value: "users",       label: "Users",      Icon: Users },
  { value: "dollar-sign", label: "Finance",    Icon: DollarSign },
  { value: "megaphone",   label: "Marketing",  Icon: Megaphone },
  { value: "globe",       label: "Globe",      Icon: Globe },
  { value: "database",    label: "Database",   Icon: Database },
  { value: "bar-chart",   label: "Analytics",  Icon: BarChart },
  { value: "settings",    label: "Settings",   Icon: Settings },
  { value: "shield",      label: "Security",   Icon: Shield },
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
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }

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

    if (!res.ok) { setError(data.error ?? "Failed to save category"); return; }
    onSaved();
    onOpenChange(false);
  }

  // Find current icon component for preview
  const selectedIconObj = ICON_OPTIONS.find((o) => o.value === form.icon);
  const PreviewIcon = selectedIconObj?.Icon ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-name">Name *</Label>
            <Input id="cat-name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Development" />
          </div>

          {/* Slug */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input id="cat-slug" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="development" />
            <p className="text-xs text-muted-foreground">Auto-generated from name. Edit manually to override.</p>
          </div>

          {/* Icon picker */}
          <div className="grid gap-1.5">
            <Label>Icon</Label>
            <div className="flex items-center gap-2 mb-2">
              {PreviewIcon ? (
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
          </div>

          {/* Order */}
          <div className="grid gap-1.5">
            <Label htmlFor="cat-order">Order</Label>
            <Input id="cat-order" type="number" value={form.order} onChange={(e) => setField("order", e.target.value)} min={0} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
