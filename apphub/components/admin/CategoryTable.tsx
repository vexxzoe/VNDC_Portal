"use client";

import {
  Code2, Server, Users, DollarSign, Megaphone,
  Globe, Database, BarChart, Settings, Shield,
  LayoutGrid, Pencil, Plus, Trash2, type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { CategoryFormModal } from "./CategoryFormModal";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Category } from "@/lib/types";

const ICON_MAP: Record<string, LucideIcon> = {
  "code-2": Code2, server: Server, users: Users,
  "dollar-sign": DollarSign, megaphone: Megaphone,
  globe: Globe, database: Database, "bar-chart": BarChart,
  settings: Settings, shield: Shield,
};

function CategoryIcon({ name }: { name: string | null }) {
  const Icon = name ? (ICON_MAP[name] ?? LayoutGrid) : LayoutGrid;
  return <Icon className="size-4 text-muted-foreground" />;
}

interface CategoryTableProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoryTable({ categories, onRefresh }: CategoryTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() { setEditCat(null); setModalOpen(true); }
  function openEdit(cat: Category) { setEditCat(cat); setModalOpen(true); }

  async function handleDelete(cat: Category) {
    const appCount = cat._count?.apps ?? 0;
    if (appCount > 0) {
      // Should not reach here (button is disabled), but guard anyway
      alert(`Cannot delete "${cat.name}": remove its ${appCount} app(s) first.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setDeleting(cat.id);
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) onRefresh();
    else {
      const d = await res.json();
      alert(d.error ?? "Failed to delete");
    }
  }

  return (
    <>
      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editCat}
        onSaved={onRefresh}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{categories.length} categories total</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" />
          Add New Category
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Slug</TableHead>
              <TableHead className="w-24 text-center">Apps</TableHead>
              <TableHead className="w-16 text-center">Order</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const appCount = cat._count?.apps ?? 0;
              const hasApps = appCount > 0;
              return (
                <TableRow key={cat.id}>
                  <TableCell>
                    <span className="flex size-7 items-center justify-center rounded bg-muted">
                      <CategoryIcon name={cat.icon} />
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{cat.slug}</code>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {appCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{cat.order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(cat)}
                              className="size-7 p-0"
                            />
                          }
                        >
                          <Pencil className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      {/* Delete — disabled if category has apps */}
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cat)}
                              disabled={hasApps || deleting === cat.id}
                              className="size-7 p-0 text-destructive hover:text-destructive disabled:pointer-events-none"
                            />
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasApps
                            ? `Remove all ${appCount} app(s) first`
                            : "Delete"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
