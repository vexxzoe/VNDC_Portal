"use client";

import {
  Code2,
  DollarSign,
  LayoutGrid,
  Lock,
  Megaphone,
  Server,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Map the icon string stored in DB to a Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  "code-2": Code2,
  server: Server,
  users: Users,
  "dollar-sign": DollarSign,
  megaphone: Megaphone,
};

function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = name ? (ICON_MAP[name] ?? LayoutGrid) : LayoutGrid;
  return <Icon className={cn("size-4 shrink-0", className)} />;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count: { apps: number };
}

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  totalApps: number;
  personalCount?: number;
}

export function Sidebar({ selectedCategory, onSelectCategory, totalApps, personalCount = 0 }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(({ categories }) => setCategories(categories ?? []));
  }, []);

  return (
    <aside className="fixed left-0 top-[60px] z-40 hidden h-[calc(100vh-60px)] w-[220px] flex-col border-r bg-background md:flex">
      {/* Scrollable category nav — takes remaining height above footer */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {/* All Apps */}
        <SidebarItem
          icon={<CategoryIcon name={null} />}
          label="All Apps"
          count={totalApps}
          active={selectedCategory === null}
          onClick={() => onSelectCategory(null)}
        />

        {/* Per-category items */}
        {categories.map((cat) => (
          <SidebarItem
            key={cat.slug}
            icon={<CategoryIcon name={cat.icon} />}
            label={cat.name}
            count={cat._count.apps}
            active={selectedCategory === cat.slug}
            onClick={() => onSelectCategory(cat.slug)}
          />
        ))}

        {/* Personal filter — always shown */}
        <SidebarItem
          icon={<Lock className="size-4 shrink-0" />}
          label="My Apps"
          count={personalCount}
          active={selectedCategory === "__personal__"}
          onClick={() => onSelectCategory("__personal__")}
        />
      </nav>

      {/* ── Bottom admin link — only visible to admins ── */}
      {isAdmin && (
        <div className="border-t p-3">
          <Link
            href="/admin"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              "hover:bg-muted hover:text-foreground",
              pathname === "/admin"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span className="truncate">Admin Panel</span>
          </Link>
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Single nav item
// ---------------------------------------------------------------------------
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, count, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        "hover:bg-muted hover:text-foreground",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground"
      )}
    >
      {icon}
      <span className="flex-1 truncate text-left">{label}</span>
      <Badge
        variant="secondary"
        className={cn(
          "ml-auto h-5 min-w-[20px] px-1.5 text-xs tabular-nums",
          active && "bg-primary/20 text-primary"
        )}
      >
        {count}
      </Badge>
    </button>
  );
}
