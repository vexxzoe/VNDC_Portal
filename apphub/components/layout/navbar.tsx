"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-6 shadow-sm">
      {/* Brand */}
      <span className="text-lg font-bold tracking-tight">AppHub</span>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {session?.user?.email && (
          <span className="hidden text-sm text-muted-foreground sm:block">
            {session.user.email}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-1.5"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
