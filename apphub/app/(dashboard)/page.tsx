"use client";

import { Clock, Globe, Lock, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { AppCard } from "@/components/app-card/AppCard";
import { AppCardSkeleton } from "@/components/app-card/AppCardSkeleton";
import { PersonalAppCard } from "@/components/app-card/PersonalAppCard";
import { RecentAppCard } from "@/components/app-card/RecentAppCard";
import { Header } from "@/components/layout/header";
import { AddPersonalAppModal } from "@/components/layout/AddPersonalAppModal";
import { EditPersonalAppModal } from "@/components/layout/EditPersonalAppModal";
import { Sidebar } from "@/components/layout/sidebar";
import { SpotlightSearch } from "@/components/layout/SpotlightSearch";
import { Button } from "@/components/ui/button";

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
  lastChecked: string | null;
  visibility: string;
  ownerId: string | null;
  category: { name: string; slug: string };
}

interface RecentApp extends App {
  openedAt: string;
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Personal app modals
  const [addPersonalOpen, setAddPersonalOpen] = useState(false);
  const [editPersonalApp, setEditPersonalApp] = useState<App | null>(null);

  const [debouncedCategory] = useDebounce(selectedCategory, 150);

  // Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSpotlightOpen((v) => !v); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Sidebar badge
  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then(({ apps }: { apps: App[] }) => setTotalApps(apps?.length ?? 0));
  }, []);

  // Recent apps
  const fetchRecent = useCallback(() => {
    fetch("/api/apps/recent")
      .then((r) => { if (!r.ok) return { apps: [] }; return r.json(); })
      .then(({ apps }: { apps: RecentApp[] }) => setRecentApps(apps ?? []))
      .catch(() => setRecentApps([]));
  }, []);
  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  // Lightweight status-only polling every 60 s — patches status/lastChecked in place, no flicker
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/apps/status");
      if (!res.ok) return;
      const { statuses } = await res.json() as {
        statuses: { id: string; status: string; lastChecked: string | null }[];
      };
      setApps((prev) =>
        prev.map((app) => {
          const s = statuses.find((x) => x.id === app.id);
          return s ? { ...app, status: s.status, lastChecked: s.lastChecked } : app;
        })
      );
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!id) id = setInterval(refreshStatus, 60_000); };
    const stop  = () => { if (id) { clearInterval(id); id = null; } };
    const onVis = () => (document.visibilityState === "hidden" ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [refreshStatus]);

  // Main app fetch — when __personal__ selected, no category param, filter client-side
  const fetchApps = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    // Don't send category param for the special personal filter
    if (debouncedCategory && debouncedCategory !== "__personal__") p.set("category", debouncedCategory);
    fetch(`/api/apps?${p}`)
      .then((r) => r.json())
      .then(({ apps }: { apps: App[] }) => { setApps(apps ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedCategory]);
  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Pin toggle
  const handlePinToggle = useCallback((id: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a)));
    fetch(`/api/apps/${id}/pin`, { method: "PATCH" })
      .then((r) => { if (!r.ok) throw new Error(); fetchApps(); })
      .catch(() => setApps((prev) => prev.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a))));
  }, [fetchApps]);

  const handleAppOpen = useCallback(() => { setTimeout(fetchRecent, 500); }, [fetchRecent]);

  // Health check
  const handleCheckNow = useCallback(async () => {
    setChecking(true);
    const toastId = toast.loading("Running health check…");
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Health check failed");
      const { up, down, checked } = data as { up: number; down: number; checked: number };
      toast.success(`Health check complete: ${up} online, ${down} offline`, { id: toastId, description: `${checked} apps checked` });
      fetchApps();
    } catch (e) {
      toast.error("Health check failed", { id: toastId, description: e instanceof Error ? e.message : "Unknown error" });
    } finally { setChecking(false); }
  }, [fetchApps]);

  // Split apps into sections
  // When personal filter active, show all personal; otherwise standard split
  const isPersonalFilter = selectedCategory === "__personal__";

  const visibleApps = isPersonalFilter
    ? apps.filter((a) => a.visibility === "personal")
    : apps;

  const pinned   = visibleApps.filter((a) => a.isPinned);
  const shared   = visibleApps.filter((a) => !a.isPinned && a.visibility === "shared");
  const personal = visibleApps.filter((a) => !a.isPinned && a.visibility === "personal");

  const personalCount = apps.filter((a) => a.visibility === "personal").length;

  const viewLabel = isPersonalFilter ? "My Apps"
    : selectedCategory ? (apps[0]?.category?.name ?? selectedCategory)
    : "All Apps";

  return (
    <>
      {/* Personal app modals */}
      <AddPersonalAppModal
        open={addPersonalOpen}
        onOpenChange={setAddPersonalOpen}
        onSaved={fetchApps}
      />
      <EditPersonalAppModal
        open={!!editPersonalApp}
        onOpenChange={(v) => { if (!v) setEditPersonalApp(null); }}
        app={editPersonalApp}
        onSaved={fetchApps}
        onDeleted={fetchApps}
      />

      <SpotlightSearch open={spotlightOpen} onOpenChange={setSpotlightOpen} />
      <Header onOpenSpotlight={() => setSpotlightOpen(true)} />
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalApps={totalApps}
        personalCount={personalCount}
      />

      <main className="pt-[60px] md:pl-[220px]">
        <div className="p-6 space-y-8">

          {/* Recently Used */}
          {recentApps.length > 0 && (
            <section>
              <SectionHeading icon={<Clock className="size-3.5" />}>Recently Used</SectionHeading>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recentApps.map((app) => (
                  <RecentAppCard key={app.id} {...app} onOpen={handleAppOpen} />
                ))}
              </div>
            </section>
          )}

          {/* Heading + Check Now */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{viewLabel}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Loading…" : (
                  <>Showing <span className="font-medium text-foreground">{visibleApps.length}</span> {visibleApps.length === 1 ? "app" : "apps"}</>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCheckNow} disabled={checking} className="shrink-0 gap-1.5">
              <RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking…" : "Check Now"}
            </Button>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="space-y-8">
              {/* Pinned */}
              {pinned.length > 0 && (
                <section>
                  <SectionHeading>
                    ★ Pinned Apps <Count n={pinned.length} />
                  </SectionHeading>
                  <ul className={GRID}>
                    {pinned.map((app) => app.visibility === "personal"
                      ? <li key={app.id}><PersonalAppCard {...app} onPinToggle={handlePinToggle} onOpen={handleAppOpen} onEdit={(id) => setEditPersonalApp(apps.find((a) => a.id === id) ?? null)} onDelete={(id) => { fetch(`/api/apps/${id}`, { method: "DELETE" }).then(() => fetchApps()); }} /></li>
                      : <li key={app.id}><AppCard {...app} onPinToggle={handlePinToggle} onOpen={handleAppOpen} /></li>
                    )}
                  </ul>
                </section>
              )}

              {/* Shared apps */}
              {!isPersonalFilter && shared.length > 0 && (
                <section>
                  <SectionHeading icon={<Globe className="size-3.5" />}>
                    Shared Apps <Count n={shared.length} />
                  </SectionHeading>
                  <ul className={GRID}>
                    {shared.map((app) => (
                      <li key={app.id}>
                        <AppCard {...app} onPinToggle={handlePinToggle} onOpen={handleAppOpen} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Personal / My Apps section — always shown */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <SectionHeading icon={<Lock className="size-3.5" />}>
                    My Apps <Count n={personal.length} />
                  </SectionHeading>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setAddPersonalOpen(true)}>
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </div>

                {personal.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                    <Lock className="mb-2 size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No personal apps yet.</p>
                    <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => setAddPersonalOpen(true)}>
                      Click + to add one
                    </Button>
                  </div>
                ) : (
                  <ul className={GRID}>
                    {personal.map((app) => (
                      <li key={app.id}>
                        <PersonalAppCard
                          {...app}
                          onPinToggle={handlePinToggle}
                          onOpen={handleAppOpen}
                          onEdit={(id) => setEditPersonalApp(apps.find((a) => a.id === id) ?? null)}
                          onDelete={(id) => {
                            if (!confirm("Delete this app?")) return;
                            fetch(`/api/apps/${id}`, { method: "DELETE" })
                              .then((r) => { if (r.ok) { toast.success("App deleted"); fetchApps(); } })
                              .catch(() => toast.error("Failed to delete"));
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeading({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}{children}
    </h2>
  );
}
function Count({ n }: { n: number }) {
  return <span className="ml-1 text-xs font-normal text-muted-foreground">({n})</span>;
}
function SkeletonGrid() {
  return (
    <ul className={GRID}>{Array.from({ length: 8 }).map((_, i) => <li key={i}><AppCardSkeleton /></li>)}</ul>
  );
}
