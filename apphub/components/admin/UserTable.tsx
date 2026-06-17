"use client";

import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserFormModal, type AdminUser } from "./UserFormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Stable color from name hash (same logic as AppCard)
function nameToColor(name: string): string {
  const PALETTE = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface UserTableProps {
  users: AdminUser[];
  currentUserId: string;
  onRefresh: () => void;
}

export function UserTable({ users, currentUserId, onRefresh }: UserTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() { setEditUser(null); setModalOpen(true); }
  function openEdit(u: AdminUser) { setEditUser(u); setModalOpen(true); }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`Xóa người dùng "${u.name ?? u.email}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(u.id);
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) onRefresh();
    else {
      const d = await res.json();
      alert(d.error ?? "Xóa người dùng thất bại");
    }
  }

  return (
    <>
      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editUser}
        currentUserId={currentUserId}
        onSaved={onRefresh}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Tổng {users.length} người dùng</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Thêm người dùng
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Ảnh đại diện</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="w-24">Vai trò</TableHead>
              <TableHead className="hidden md:table-cell w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const label = u.name ?? u.email;
              const initials = label.slice(0, 2).toUpperCase();
              const isSelf = u.id === currentUserId;

              return (
                <TableRow key={u.id}>
                  {/* Avatar */}
                  <TableCell>
                    <span
                      className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white select-none"
                      style={{ backgroundColor: nameToColor(label) }}
                    >
                      {initials}
                    </span>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="font-medium">
                    {u.name ?? <span className="text-muted-foreground italic">—</span>}
                    {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(bạn)</span>}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>

                  {/* Role badge */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs capitalize",
                        u.role === "admin"
                          ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                          : "bg-slate-400/10 text-slate-600 border-slate-400/20"
                      )}
                    >
                      {u.role === "admin" ? "Quản trị viên" : "Thành viên"}
                    </Badge>
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="size-7 p-0" />
                          }
                        >
                          <Pencil className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Chỉnh sửa</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(u)}
                              disabled={isSelf || deleting === u.id}
                              className="size-7 p-0 text-destructive hover:text-destructive disabled:pointer-events-none"
                            />
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {isSelf ? "Không thể xóa tài khoản của mình" : "Xóa"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Không có người dùng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
