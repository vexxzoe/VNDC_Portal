"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared color helper (kept in sync with AppCard)
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RecentAppCardProps {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  category: { name: string; slug: string };
  openedAt: string | Date;
  onOpen?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// RecentAppCard — compact horizontal card for the "Recently Used" strip
// ---------------------------------------------------------------------------
export function RecentAppCard({
  id,
  name,
  url,
  icon,
  category,
  openedAt,
  onOpen,
}: RecentAppCardProps) {
  const isIconUrl = icon?.startsWith("http") || icon?.startsWith("/");
  const initials = name.slice(0, 2).toUpperCase();
  const avatarBg = nameToColor(name);
  const timeAgo = formatDistanceToNow(new Date(openedAt), { addSuffix: true, locale: vi });

  function handleOpen() {
    fetch(`/api/apps/${id}/open`, { method: "POST" }).catch(() => {});
    onOpen?.(id);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={cn(
        "flex w-[200px] shrink-0 flex-col gap-2 rounded-lg border bg-background p-3",
        "transition-all duration-150 hover:border-primary/40 hover:shadow-sm"
      )}
    >
      {/* Icon + name row */}
      <div className="flex items-center gap-2">
        {/* Icon / initials avatar */}
        {isIconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={icon!}
            alt=""
            className="size-8 shrink-0 rounded-md bg-muted object-contain p-0.5"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className={cn(
            "size-8 shrink-0 rounded-md flex items-center justify-center text-xs font-bold text-white select-none",
            isIconUrl && "hidden"
          )}
          style={{ backgroundColor: avatarBg }}
          aria-hidden="true"
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{category.name}</p>
        </div>
      </div>

      {/* Time + open button row */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground truncate">{timeAgo}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 shrink-0 gap-1 px-2 text-xs"
          onClick={handleOpen}
        >
          <ExternalLink className="size-3" />
          Mở
        </Button>
      </div>
    </div>
  );
}
