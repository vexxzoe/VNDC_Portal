"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface App {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
  isPinned: boolean;
  status: string;
  category: { name: string; slug: string };
}

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap matched substring in a <mark> tag. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-200 px-0.5 text-yellow-900 not-dark:bg-yellow-200 dark:bg-yellow-400/30 dark:text-yellow-200">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Stable color from name hash — matches AppCard. */
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

function AppIcon({ app }: { app: App }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isUrl = app.icon?.startsWith("http");

  if (isUrl && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={app.icon!}
        alt=""
        className="size-6 shrink-0 rounded bg-muted object-contain p-0.5"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white select-none"
      style={{ backgroundColor: nameToColor(app.name) }}
      aria-hidden
    >
      {app.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SpotlightSearch
// ---------------------------------------------------------------------------
export function SpotlightSearch({ open, onOpenChange }: SpotlightSearchProps) {
  const [query, setQuery] = useState("");
  const [allApps, setAllApps] = useState<App[]>([]);
  const hasFetched = useRef(false);

  // Fetch all apps once on first open; cache for the session
  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetch("/api/apps")
        .then((r) => r.json())
        .then(({ apps }: { apps: App[] }) => setAllApps(apps ?? []));
    }
    if (!open) setQuery("");
  }, [open]);

  // Client-side filter — instant, zero API calls while typing
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allApps;
    return allApps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.category.name.toLowerCase().includes(q)
    );
  }, [query, allApps]);

  const pinned = filtered.filter((a) => a.isPinned);

  // Group unpinned apps by category, preserving insertion order
  const byCategory = useMemo(() => {
    const map = new Map<string, App[]>();
    for (const app of filtered) {
      if (app.isPinned) continue;
      const key = app.category.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    }
    return map;
  }, [filtered]);

  function openApp(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Apps"
      description="Search and open internal tools"
      className="max-w-xl"
    >
      {/*
       * Command is the cmdk root — it must wrap Input + List so cmdk can
       * wire up keyboard navigation, filtering context, etc.
       * We use shouldFilter=false because we handle filtering ourselves.
       */}
      <Command shouldFilter={false} className="rounded-xl!">
        <CommandInput
          placeholder="Search apps…"
          value={query}
          onValueChange={setQuery}
          autoFocus
        />

        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <ExternalLink className="size-8 opacity-30" />
              <span className="text-sm">
                No results for &ldquo;{query}&rdquo;
              </span>
            </div>
          </CommandEmpty>

          {/* Pinned group */}
          {pinned.length > 0 && (
            <>
              <CommandGroup heading="Pinned">
                {pinned.map((app) => (
                  <ResultItem
                    key={app.id}
                    app={app}
                    query={query}
                    onSelect={() => openApp(app.url)}
                  />
                ))}
              </CommandGroup>
              {byCategory.size > 0 && <CommandSeparator />}
            </>
          )}

          {/* Per-category groups */}
          {Array.from(byCategory.entries()).map(([category, apps], i, arr) => (
            <span key={category}>
              <CommandGroup heading={category.toUpperCase()}>
                {apps.map((app) => (
                  <ResultItem
                    key={app.id}
                    app={app}
                    query={query}
                    onSelect={() => openApp(app.url)}
                  />
                ))}
              </CommandGroup>
              {i < arr.length - 1 && <CommandSeparator />}
            </span>
          ))}
        </CommandList>

        {/* Footer keyboard hints */}
        <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>
            <kbd className="kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd> open
          </span>
          <span>
            <kbd className="kbd">esc</kbd> close
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

// ---------------------------------------------------------------------------
// Single result row
// ---------------------------------------------------------------------------
function ResultItem({
  app,
  query,
  onSelect,
}: {
  app: App;
  query: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      // Use a value that includes all searchable text so cmdk's own
      // selection logic still works correctly (we filter ourselves but
      // cmdk needs a value for keyboard tracking)
      value={`${app.id}:${app.name}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 py-2"
    >
      <AppIcon app={app} />

      <span className="flex-1 truncate font-medium">
        <Highlight text={app.name} query={query} />
      </span>

      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
        <Highlight text={app.category.name} query={query} />
      </span>

      <ExternalLink className="size-3.5 shrink-0 opacity-40" />
    </CommandItem>
  );
}
