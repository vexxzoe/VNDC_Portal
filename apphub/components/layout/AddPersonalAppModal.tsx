"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName(""); setUrl(""); setDescription(""); setIcon("");
    setError(null); setFetchingIcon(false);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function autoFetchIcon(u: string) {
    if (!u.trim() || !u.startsWith("http")) return;
    setFetchingIcon(true);
    try {
      const res = await fetch(`/api/favicon?url=${encodeURIComponent(u.trim())}`);
      const data = await res.json();
      if (data.iconUrl) {
        setIcon(data.iconUrl);
        toast.success("Icon fetched!");
      } else {
        toast.warning("Could not fetch icon", { description: "Enter one manually." });
      }
    } catch { toast.error("Failed to fetch icon"); }
    finally { setFetchingIcon(false); }
  }

  function handleUrlBlur() {
    if (url.trim() && !icon.trim()) autoFetchIcon(url);
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Name is required"); return; }
    if (!url.trim()) { setError("URL is required"); return; }
    if (!url.startsWith("http")) { setError("URL must start with http"); return; }

    setSaving(true);
    const res = await fetch("/api/apps/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description, icon }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    toast.success("App added to your personal workspace!");
    reset();
    onOpenChange(false);
    onSaved();
  }

  const iconPreview = icon.startsWith("http")
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={icon} alt="" className="size-8 shrink-0 rounded object-contain bg-muted p-0.5" />
    : name
      ? <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">{name.slice(0, 2).toUpperCase()}</span>
      : <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">?</span>;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Personal App</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="pa-name">Name *</Label>
            <Input id="pa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My App" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pa-url">URL *</Label>
            <Input id="pa-url" value={url} onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur} placeholder="https://example.com" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pa-desc">Description</Label>
            <Textarea id="pa-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description…" rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pa-icon">Icon URL</Label>
            <div className="flex items-center gap-2">
              {iconPreview}
              <Input id="pa-icon" className="flex-1" value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="https://example.com/icon.png" />
              <Button type="button" variant="outline" size="sm"
                disabled={!url.trim() || fetchingIcon}
                onClick={() => autoFetchIcon(url)}
                className="shrink-0 gap-1.5">
                {fetchingIcon ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                {fetchingIcon ? "…" : "Fetch"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Add App"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
