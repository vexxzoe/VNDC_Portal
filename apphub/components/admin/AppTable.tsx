"use client";

import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppFormModal } from "./AppFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { App, Category } from "@/lib/types";

interface AppTableProps {
  apps: App[];
  categories: Category[];
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  up:      "bg-green-500/15 text-green-700 border-green-500/30",
  down:    "bg-red-500/15 text-red-700 border-red-500/30",
  unknown: "bg-slate-400/15 text-slate-600 border-slate-400/30",
};

type FilterValue = "all" | "shared" | "personal";

export function AppTable({ apps, categories, onRefresh }: AppTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  function openAdd() { setEditApp(null); setModalOpen(true); }
  function openEdit(app: App) { setEditApp(app); setModalOpen(true); }

  async function handleDelete(app: App) {
    if (!confirm(`Xóa "${app.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(app.id);
    const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) onRefresh();
    else { const d = await res.json(); alert(d.error ?? "Xóa thất bại"); }
  }

  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.visibility === filter);
  }, [apps, filter]);

  return (
    <>
      <AppFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        app={editApp}
        categories={categories}
        onSaved={onRefresh}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Tổng {filtered.length} / {apps.length} ứng dụng</p>
          {/* Visibility filter */}
          <Select value={filter} onValueChange={(v) => setFilter((v ?? "all") as FilterValue)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="shared">Chỉ dùng chung</SelectItem>
              <SelectItem value="personal">Chỉ cá nhân</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Thêm ứng dụng
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Biểu tượng</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead className="hidden sm:table-cell">Danh mục</TableHead>
              <TableHead className="w-24">Loại</TableHead>
              <TableHead className="hidden lg:table-cell">Người sở hữu</TableHead>
              <TableHead className="w-14 text-center">Đã ghim</TableHead>
              <TableHead className="w-20">Trạng thái</TableHead>
              <TableHead className="w-20 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((app) => (
              <TableRow key={app.id}>
                {/* Icon */}
                <TableCell>
                  {app.icon?.startsWith("http") || app.icon?.startsWith("/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={app.icon} alt="" className="size-7 rounded object-contain bg-muted p-0.5" />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                      {app.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </TableCell>

                {/* Name */}
                <TableCell className="font-medium">{app.name}</TableCell>

                {/* URL */}
                <TableCell className="hidden md:table-cell max-w-[180px]">
                  <span className="truncate block text-xs text-muted-foreground">{app.url}</span>
                </TableCell>

                {/* Category */}
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="text-xs">{app.category.name}</Badge>
                </TableCell>

                {/* Visibility */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      app.visibility === "shared"
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        : "bg-slate-400/10 text-slate-600 border-slate-400/20"
                    )}
                  >
                    {app.visibility === "shared" ? "Dùng chung" : "Cá nhân"}
                  </Badge>
                </TableCell>

                {/* Owner */}
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {app.owner
                    ? (app.owner.name ?? app.owner.email)
                    : <span className="italic opacity-50">—</span>
                  }
                </TableCell>

                {/* Pinned */}
                <TableCell className="text-center">
                  {app.isPinned && <Star className="mx-auto size-4 fill-amber-400 stroke-amber-500" />}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status] ?? STATUS_COLORS.unknown}`}>
                    {app.status}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger render={<Button variant="ghost" size="sm" onClick={() => openEdit(app)} className="size-7 p-0" />}>
                        <Pencil className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Chỉnh sửa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(app)}
                            disabled={deleting === app.id}
                            className="size-7 p-0 text-destructive hover:text-destructive" />
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Xóa</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  {filter === "all" ? "Chưa có ứng dụng. Nhấn \"Thêm ứng dụng\" để bắt đầu." : `Không có ứng dụng nào.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
