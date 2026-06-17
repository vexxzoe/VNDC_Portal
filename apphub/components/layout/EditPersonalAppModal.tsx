"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function EditPersonalAppModal({
  open, onOpenChange, app, onSaved, onDeleted,
}: EditPersonalAppModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && app) {
      setName(app.name);
      setUrl(app.url);
      setDescription(app.description ?? "");
      setIcon(app.icon ?? "");
      setError(null);
    }
  }, [open, app]);

  async function autoFetchIcon(u: string) {
    if (!u.trim() || !u.startsWith("http")) return;
    setFetchingIcon(true);
    try {
      const res = await fetch(`/api/favicon?url=${encodeURIComponent(u.trim())}`);
      const data = await res.json();
      if (data.iconUrl) { setIcon(data.iconUrl); toast.success("Icon fetched!"); }
      else toast.warning("Could not fetch icon");
    } catch { toast.error("Failed to fetch icon"); }
    finally { setFetchingIcon(false); }
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Name is required"); return; }
    if (!url.trim()) { setError("URL is required"); return; }
    if (!url.startsWith("http")) { setError("URL must start with http"); return; }
    if (!app) return;

    setSaving(true);
    const res = await fetch(`/api/apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description: description || null, icon: icon || null }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    toast.success("App updated");
    onOpenChange(false);
    onSaved();
  }

  async function handleDelete() {
    if (!app) return;
    if (!confirm(`Delete "${app.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("App deleted");
      onOpenChange(false);
      onDeleted();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to delete");
    }
  }

  const iconPreview = icon.startsWith("http")
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={icon} alt="" className="size-8 shrink-0 rounded object-contain bg-muted p-0.5" />
    : name
      ? <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">{name.slice(0, 2).toUpperCase()}</span>
      : <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">?</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Personal App</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="ep-name">Name *</Label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ep-url">URL *</Label>
            <Input id="ep-url" value={url} onChange={(e) => setUrl(e.target.value)}
              onBlur={() => { if (url.trim() && !icon.trim()) autoFetchIcon(url); }} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ep-desc">Description</Label>
            <Textarea id="ep-desc" value={description}
              onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ep-icon">Icon URL</Label>
            <div className="flex items-center gap-2">
              {iconPreview}
              <Input id="ep-icon" className="flex-1" value={icon} onChange={(e) => setIcon(e.target.value)} />
              <Button type="button" variant="outline" size="sm"
                disabled={!url.trim() || fetchingIcon}
                onClick={() => autoFetchIcon(url)} className="shrink-0 gap-1.5">
                {fetchingIcon ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                {fetchingIcon ? "…" : "Fetch"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          {/* Delete on the left */}
          <Button variant="outline" onClick={handleDelete} disabled={deleting || saving}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive">
            {deleting ? "Deleting…" : "Delete"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || deleting}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
