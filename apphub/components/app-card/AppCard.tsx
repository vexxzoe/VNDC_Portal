"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AppCardProps {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: { name: string; slug: string };
  isPinned: boolean;
  status: string;          // "up" | "down" | "unknown"
  lastChecked?: string | Date | null;
  onPinToggle: (id: string) => void;
  onOpen?: (id: string) => void; // optional callback after recording history
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function nameToColor(name: string): string {
  const PALETTE = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
  up: {
    dot: "bg-green-500",
    label: "Online",
    badge: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  down: {
    dot: "bg-red-500",
    label: "Offline",
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  unknown: {
    dot: "bg-slate-400",
    label: "Unknown",
    badge: "bg-slate-400/10 text-slate-500 border-slate-400/20",
  },
};

// ---------------------------------------------------------------------------
// AppCard
// ---------------------------------------------------------------------------
export function AppCard({
  id,
  name,
  url,
  description,
  icon,
  category,
  isPinned,
  status,
  lastChecked,
  onPinToggle,
  onOpen,
}: AppCardProps) {
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const isIconUrl = icon?.startsWith("http");
  const initials = name.slice(0, 2).toUpperCase();
  const avatarBg = nameToColor(name);

  // Format lastChecked for tooltip
  const checkedLabel = lastChecked
    ? `Last checked: ${formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}`
    : "Not checked yet";

  return (
    <Card
      className={cn(
        "group flex flex-col gap-0 overflow-hidden transition-all duration-150",
        "hover:shadow-md hover:border-primary/40"
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* ── Top row: icon + status badge ── */}
        <div className="flex items-start justify-between gap-2">
          {/* Icon / avatar */}
          {isIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon!}
              alt={`${name} icon`}
              className="size-10 shrink-0 rounded-lg bg-muted object-contain p-0.5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className={cn(
              "size-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white select-none",
              isIconUrl && "hidden"
            )}
            style={{ backgroundColor: avatarBg }}
            aria-hidden="true"
          >
            {initials}
          </span>

          {/* Status badge with lastChecked tooltip */}
          <Tooltip>
            <TooltipTrigger
              className={cn(
                "ml-auto flex cursor-default items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                statusCfg.badge
              )}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </TooltipTrigger>
            <TooltipContent side="top">{checkedLabel}</TooltipContent>
          </Tooltip>
        </div>

        {/* ── App name + category ── */}
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 font-semibold leading-tight">{name}</h3>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {category.name}
          </Badge>
        </div>

        {/* ── Description ── */}
        <p
          className={cn(
            "flex-1 line-clamp-2 text-sm leading-snug text-muted-foreground",
            !description && "italic opacity-50"
          )}
        >
          {description ?? "No description"}
        </p>

        {/* ── Action row ── */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => {
              // Fire-and-forget — record history without blocking the tab open
              fetch(`/api/apps/${id}/open`, { method: "POST" }).catch(() => {});
              onOpen?.(id);
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="size-3.5" />
            Open App
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "shrink-0 px-2",
              isPinned && "text-amber-500 hover:text-amber-600"
            )}
            onClick={() => onPinToggle(id)}
            aria-label={isPinned ? "Unpin app" : "Pin app"}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <Star
              className={cn(
                "size-4",
                isPinned && "fill-amber-500 stroke-amber-500"
              )}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
