"use client";

import { Bell, FlaskConical, Mail, Plus, Trash2, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NotificationSetting {
  id: string;
  type: "slack" | "email";
  enabled: boolean;
  webhookUrl: string | null;
  emailTo: string | null;
  createdAt: string;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSlack, setAddingSlack] = useState(false);
  const [addingEmail, setAddingEmail] = useState(false);
  const [slackForm, setSlackForm] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [saving, setSaving] = useState<"slack" | "email" | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchSettings() {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(({ settings }) => { setSettings(settings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { fetchSettings(); }, []);

  async function handleToggle(s: NotificationSetting) {
    const res = await fetch(`/api/notifications/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    if (res.ok) fetchSettings();
    else toast.error("Cập nhật thất bại");
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa kênh thông báo này?")) return;
    setDeleting(id);
    const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) fetchSettings();
    else toast.error("Xóa thất bại");
  }

  async function handleTest(id: string, type: string) {
    setTesting(id);
    const toastId = toast.loading(`Đang gửi thông báo thử ${type}…`);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setTesting(null);
      if (res.ok) toast.success("Đã gửi thử thành công!", { id: toastId });
      else toast.error("Gửi thử thất bại", { id: toastId, description: data.error });
    } catch {
      setTesting(null);
      toast.error("Gửi thử thất bại", { id: toastId, description: "Lỗi kết nối" });
    }
  }

  async function handleAddSlack() {
    if (!slackForm.trim()) { toast.error("Địa chỉ Webhook là bắt buộc"); return; }
    setSaving("slack");
    const res = await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "slack", webhookUrl: slackForm.trim() }),
    });
    const data = await res.json();
    setSaving(null);
    if (res.ok) { setSlackForm(""); setAddingSlack(false); fetchSettings(); toast.success("Đã thêm kênh Slack"); }
    else toast.error(data.error ?? "Thêm kênh Slack thất bại");
  }

  async function handleAddEmail() {
    if (!emailForm.trim()) { toast.error("Địa chỉ Email là bắt buộc"); return; }
    setSaving("email");
    const res = await fetch("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", emailTo: emailForm.trim() }),
    });
    const data = await res.json();
    setSaving(null);
    if (res.ok) { setEmailForm(""); setAddingEmail(false); fetchSettings(); toast.success("Đã thêm kênh Email"); }
    else toast.error(data.error ?? "Thêm kênh Email thất bại");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Kênh thông báo</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Nhận thông báo khi ứng dụng ngừng hoạt động.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => { setAddingSlack(true); setAddingEmail(false); }} className="gap-1.5">
            <Plus className="size-3.5" />Thêm Slack
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAddingEmail(true); setAddingSlack(false); }} className="gap-1.5">
            <Plus className="size-3.5" />Thêm Email
          </Button>
        </div>
      </div>

      {addingSlack && (
        <AddForm icon={<Webhook className="size-4 text-[#E01E5A]" />}
          label="Địa chỉ Webhook Slack"
          placeholder="https://hooks.slack.com/services/..."
          value={slackForm} onChange={setSlackForm}
          onSave={handleAddSlack}
          onCancel={() => { setAddingSlack(false); setSlackForm(""); }}
          saving={saving === "slack"} />
      )}

      {addingEmail && (
        <AddForm icon={<Mail className="size-4 text-blue-500" />}
          label="Địa chỉ Email"
          placeholder="ops@company.com"
          value={emailForm} onChange={setEmailForm}
          onSave={handleAddEmail}
          onCancel={() => { setAddingEmail(false); setEmailForm(""); }}
          saving={saving === "email"} />
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
      ) : settings.length === 0 && !addingSlack && !addingEmail ? (
        <EmptyChannels />
      ) : (
        <div className="space-y-3">
          {settings.map((s) => (
            <ChannelRow key={s.id} setting={s}
              onToggle={() => handleToggle(s)}
              onTest={() => handleTest(s.id, s.type)}
              onDelete={() => handleDelete(s.id)}
              testing={testing === s.id}
              deleting={deleting === s.id} />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-200">
        <p className="font-medium">Cách thông báo hoạt động</p>
        <p className="mt-1 text-amber-700 dark:text-amber-300">
          Thông báo chỉ gửi <strong>một lần</strong> khi ứng dụng chuyển từ Trực tuyến → Ngoại tuyến.
          Sẽ không gửi lại trong khi ứng dụng vẫn ngoại tuyến. Thông báo sẽ gửi lại nếu ứng dụng hoạt động trở lại rồi lại ngừng.
        </p>
      </div>
    </div>
  );
}

function AddForm({ icon, label, placeholder, value, onChange, onSave, onCancel, saving }: {
  icon: React.ReactNode; label: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">{icon}{label}</div>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} autoFocus />
        <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Hủy</Button>
      </div>
    </div>
  );
}

function ChannelRow({ setting, onToggle, onTest, onDelete, testing, deleting }: {
  setting: NotificationSetting; onToggle: () => void; onTest: () => void;
  onDelete: () => void; testing: boolean; deleting: boolean;
}) {
  const isSlack = setting.type === "slack";
  const displayLabel = isSlack
    ? (setting.webhookUrl ? `…${setting.webhookUrl.slice(-30)}` : "Chưa có URL")
    : (setting.emailTo ?? "Chưa có email");

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-background p-4 transition-opacity", !setting.enabled && "opacity-60")}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {isSlack ? <Webhook className="size-4 text-[#E01E5A]" /> : <Mail className="size-4 text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium capitalize">{isSlack ? "Slack" : "Email"}</p>
        <p className="text-xs text-muted-foreground truncate">{displayLabel}</p>
      </div>
      <Badge variant="secondary" className={cn("shrink-0 text-xs",
        setting.enabled ? "bg-green-500/10 text-green-700 border-green-500/20" : "bg-slate-400/10 text-slate-500 border-slate-400/20")}>
        {setting.enabled ? "Đang bật" : "Đang tắt"}
      </Badge>
      <Switch checked={setting.enabled} onCheckedChange={onToggle} size="sm" />
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="outline" size="sm" onClick={onTest}
            disabled={testing || !setting.enabled} className="gap-1.5" />
        }>
          <FlaskConical className="size-3.5" />
          {testing ? "Đang gửi..." : "Kiểm tra"}
        </TooltipTrigger>
        <TooltipContent>Gửi thông báo thử</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={deleting}
            className="size-7 p-0 text-destructive hover:text-destructive" />
        }>
          <Trash2 className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Xóa kênh</TooltipContent>
      </Tooltip>
    </div>
  );
}

function EmptyChannels() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <Bell className="mb-3 size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">Chưa có kênh thông báo nào</p>
      <p className="mt-1 text-xs text-muted-foreground">Thêm webhook Slack hoặc địa chỉ email để nhận cảnh báo.</p>
    </div>
  );
}
