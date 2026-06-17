"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  name: "",
  url: "",
  description: "",
  icon: "",
  categoryId: "",
  isPinned: false,
  order: "0",
};

export function AppFormModal({
  open,
  onOpenChange,
  app,
  categories,
  onSaved,
}: AppFormModalProps) {
  const isEdit = !!app;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingIcon, setFetchingIcon] = useState(false);

  // Pre-fill when opening
  useEffect(() => {
    if (open) {
      setError(null);
      setFetchingIcon(false);
      setForm(
        app
          ? {
              name: app.name,
              url: app.url,
              description: app.description ?? "",
              icon: app.icon ?? "",
              categoryId: app.categoryId,
              isPinned: app.isPinned,
              order: String(app.order),
            }
          : EMPTY
      );
    }
  }, [open, app]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // ---------------------------------------------------------------------------
  // Favicon auto-fetch
  // ---------------------------------------------------------------------------
  async function autoFetchIcon(url: string) {
    if (!url.trim() || !url.startsWith("http")) return;

    setFetchingIcon(true);
    try {
      const res = await fetch(
        `/api/favicon?url=${encodeURIComponent(url.trim())}`
      );
      const data = await res.json();

      if (data.iconUrl) {
        set("icon", data.iconUrl);
        toast.success("Icon fetched!", {
          description: "You can still replace it with a custom URL.",
        });
      } else {
        toast.warning("Could not fetch icon", {
          description: "Please enter an icon URL manually.",
        });
      }
    } catch {
      toast.error("Failed to fetch icon");
    } finally {
      setFetchingIcon(false);
    }
  }

  // Trigger on URL blur only when icon field is currently empty
  function handleUrlBlur() {
    if (form.url.trim() && !form.icon.trim()) {
      autoFetchIcon(form.url);
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  async function handleSave() {
    setError(null);
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.url.trim()) { setError("URL is required"); return; }
    if (!form.url.startsWith("http")) { setError("URL must start with http"); return; }
    if (!form.categoryId) { setError("Category is required"); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      url: form.url.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      categoryId: form.categoryId,
      isPinned: form.isPinned,
      order: parseInt(form.order, 10) || 0,
    };

    const res = await fetch(
      isEdit ? `/api/apps/${app!.id}` : "/api/apps",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save app"); return; }
    onSaved();
    onOpenChange(false);
  }

  // ---------------------------------------------------------------------------
  // Icon preview
  // ---------------------------------------------------------------------------
  const iconPreview = form.icon.startsWith("http") ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={form.icon}
      alt=""
      className="size-8 shrink-0 rounded object-contain bg-muted p-0.5"
    />
  ) : form.name ? (
    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
      {form.name.slice(0, 2).toUpperCase()}
    </span>
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
      ?
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit App" : "Add New App"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="app-name">Name *</Label>
            <Input
              id="app-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="GitLab"
            />
          </div>

          {/* URL — auto-fetches icon on blur when icon is empty */}
          <div className="grid gap-1.5">
            <Label htmlFor="app-url">URL *</Label>
            <Input
              id="app-url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://gitlab.internal"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="app-desc">Description</Label>
            <Textarea
              id="app-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description…"
              rows={2}
            />
          </div>

          {/* Icon URL — preview + manual input + auto-fetch button */}
          <div className="grid gap-1.5">
            <Label htmlFor="app-icon">Icon URL</Label>

            {/* Row: preview | input | auto-fetch button */}
            <div className="flex items-center gap-2">
              {iconPreview}

              <Input
                id="app-icon"
                className="flex-1"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="https://cdn.simpleicons.org/gitlab"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!form.url.trim() || fetchingIcon}
                onClick={() => autoFetchIcon(form.url)}
                className="shrink-0 gap-1.5"
                title="Auto-fetch icon from URL"
              >
                {fetchingIcon ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {fetchingIcon ? "Fetching…" : "Auto-fetch"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tab out of the URL field to auto-fetch, or click the button
              manually. You can always override with a custom URL.
            </p>
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <Label>Category *</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => set("categoryId", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order + IsPinned */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="app-order">Order</Label>
              <Input
                id="app-order"
                type="number"
                value={form.order}
                onChange={(e) => set("order", e.target.value)}
                min={0}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Pinned</Label>
              <div className="flex h-8 items-center">
                <Switch
                  checked={form.isPinned}
                  onCheckedChange={(v) => set("isPinned", v)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
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
