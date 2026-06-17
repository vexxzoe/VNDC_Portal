"use client";

import { LayoutGrid, LogOut, Search, Settings, UserCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSpotlight: () => void;
}

export function Header({ onOpenSpotlight }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const role = session?.user?.role ?? "member";
  const isAdmin = role === "admin";

  const initials =
    userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <>
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />

      <header className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center gap-4 border-b bg-background px-4 shadow-sm md:px-6">
        {/* Logo — click to go home */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 cursor-pointer no-underline"
          aria-label="AppHub home"
        >
          <LayoutGrid className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">AppHub</span>
        </Link>

        {/* Search trigger */}
        <button
          onClick={onOpenSpotlight}
          className={cn(
            "relative mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-lg border",
            "border-input bg-transparent px-3 text-sm text-muted-foreground",
            "transition-colors hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="Open search (Ctrl+K)"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Tìm ứng dụng…</span>
          <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* User menu */}
        <div className="ml-auto shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="User menu"
              className="flex items-center rounded-full outline-none ring-ring focus-visible:ring-2"
            >
              <Avatar className="size-8 cursor-pointer select-none">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User info */}
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium flex-1">
                    {session?.user?.name ?? session?.user?.email}
                  </p>
                  {/* Role badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      isAdmin
                        ? "bg-blue-500/15 text-blue-700"
                        : "bg-slate-400/15 text-slate-600"
                    )}
                  >
                    {role}
                  </span>
                </div>
                {session?.user?.name && (
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {session.user.email}
                  </p>
                )}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setProfileOpen(true)}
                  className="cursor-pointer"
                >
                  <UserCircle className="size-4" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>

                {/* Admin Panel — only visible to admins */}
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="cursor-pointer"
                  >
                    <Settings className="size-4" />
                    Trang quản trị
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="cursor-pointer"
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
