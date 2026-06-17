"use client";

import { ArrowLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AppTable } from "@/components/admin/AppTable";
import { CategoryTable } from "@/components/admin/CategoryTable";
import { NotificationSettings } from "@/components/admin/NotificationSettings";
import { UserTable } from "@/components/admin/UserTable";
import type { AdminUser } from "@/components/admin/UserFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { App, Category } from "@/lib/types";

export default function AdminPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchApps = useCallback(() => {
    setLoadingApps(true);
    fetch("/api/apps?admin=true")
      .then((r) => r.json())
      .then(({ apps }) => { setApps(apps ?? []); setLoadingApps(false); })
      .catch(() => setLoadingApps(false));
  }, []);

  const fetchCategories = useCallback(() => {
    setLoadingCats(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then(({ categories }) => { setCategories(categories ?? []); setLoadingCats(false); })
      .catch(() => setLoadingCats(false));
  }, []);

  const fetchUsers = useCallback(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then(({ users }) => { setUsers(users ?? []); setLoadingUsers(false); })
      .catch(() => setLoadingUsers(false));
  }, [isAdmin]);

  useEffect(() => { fetchApps(); }, [fetchApps]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function onAppSaved() { fetchApps(); fetchCategories(); }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex h-[60px] items-center gap-4 border-b bg-background px-4 shadow-sm md:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <LayoutGrid className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">AppHub</span>
        </div>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Admin Panel</span>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage apps, categories, and users across AppHub.
          </p>
        </div>

        <Tabs defaultValue="apps">
          <TabsList className="mb-6">
            <TabsTrigger value="apps">
              Apps
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {loadingApps ? "…" : apps.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="categories">
              Categories
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {loadingCats ? "…" : categories.length}
              </span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users">
                Users
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {loadingUsers ? "…" : users.length}
                </span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="notifications">
                Notifications
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="apps">
            {loadingApps ? <LoadingRow /> : (
              <AppTable apps={apps} categories={categories} onRefresh={onAppSaved} />
            )}
          </TabsContent>

          <TabsContent value="categories">
            {loadingCats ? <LoadingRow /> : (
              <CategoryTable
                categories={categories}
                onRefresh={() => { fetchCategories(); fetchApps(); }}
              />
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              {loadingUsers ? <LoadingRow /> : (
                <UserTable
                  users={users}
                  currentUserId={session?.user?.id ?? ""}
                  onRefresh={fetchUsers}
                />
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}
