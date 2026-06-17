"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function nameToColor(name: string): string {
  const P = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return P[Math.abs(h) % P.length];
}

export interface PersonalAppCardProps {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: { name: string; slug: string };
  isPinned: boolean;
  status: string;
  lastChecked?: string | Date | null;
  onOpen?: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPinToggle: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  up:      { dot: "bg-green-500",  label: "Online",  badge: "bg-green-500/10 text-green-600 border-green-500/20" },
  down:    { dot: "bg-red-500",    label: "Offline", badge: "bg-red-500/10 text-red-600 border-red-500/20" },
  unknown: { dot: "bg-slate-400",  label: "Unknown", badge: "bg-slate-400/10 text-slate-500 border-slate-400/20" },
};

export function PersonalAppCard({
  id, name, url, description, icon, category, isPinned, status,
  lastChecked, onOpen, onEdit, onDelete, onPinToggle,
}: PersonalAppCardProps) {
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const isIconUrl = icon?.startsWith("http");
  const initials = name.slice(0, 2).toUpperCase();
  const avatarBg = nameToColor(name);
  const checkedLabel = lastChecked
    ? `Last checked: ${formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}`
    : "Not checked yet";

  return (
    <Card className={cn(
      "group/card relative flex flex-col gap-0 overflow-hidden transition-all duration-150",
      "hover:shadow-md hover:border-primary/40"
    )}>
      {/* Hover action buttons — top-right corner */}
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="secondary" size="sm"
                onClick={() => onEdit(id)}
                className="size-6 p-0 shadow-sm"
              />
            }
          >
            <Pencil className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="secondary" size="sm"
                onClick={() => onDelete(id)}
                className="size-6 p-0 shadow-sm text-destructive hover:text-destructive"
              />
            }
          >
            <Trash2 className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Icon + status */}
        <div className="flex items-start justify-between gap-2">
          {isIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon!} alt="" className="size-10 shrink-0 rounded-lg bg-muted object-contain p-0.5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className={cn("size-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white select-none", isIconUrl && "hidden")}
            style={{ backgroundColor: avatarBg }} aria-hidden="true"
          >{initials}</span>

          <Tooltip>
            <TooltipTrigger className={cn("ml-auto flex cursor-default items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", statusCfg.badge)}>
              <span className={cn("size-1.5 shrink-0 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </TooltipTrigger>
            <TooltipContent side="top">{checkedLabel}</TooltipContent>
          </Tooltip>
        </div>

        {/* Name + category */}
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 font-semibold leading-tight">{name}</h3>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">{category.name}</Badge>
        </div>

        {/* Description */}
        <p className={cn("flex-1 line-clamp-2 text-sm leading-snug text-muted-foreground", !description && "italic opacity-50")}>
          {description ?? "No description"}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => {
            fetch(`/api/apps/${id}/open`, { method: "POST" }).catch(() => {});
            onOpen?.(id);
            window.open(url, "_blank", "noopener,noreferrer");
          }}>
            <ExternalLink className="size-3.5" />
            Open App
          </Button>
          <Button size="sm" variant="ghost"
            className={cn("shrink-0 px-2", isPinned && "text-amber-500 hover:text-amber-600")}
            onClick={() => onPinToggle(id)}
            aria-label={isPinned ? "Unpin" : "Pin"}
          >
            <Star className={cn("size-4", isPinned && "fill-amber-500 stroke-amber-500")} />
          </Button>
        </div>

        {/* Personal badge */}
        <div className="flex">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Personal
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
