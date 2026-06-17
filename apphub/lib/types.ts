// Shared domain types used across admin and dashboard components

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order: number;
  _count?: { apps: number };
}

export interface App {
  id: string;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  isPinned: boolean;
  order: number;
  status: string;
  visibility: string;      // "shared" | "personal"
  ownerId: string | null;
  owner?: { id: string; name: string | null; email: string } | null;
}
