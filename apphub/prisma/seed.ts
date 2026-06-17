import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/apphub.db" });
const db = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Development", slug: "development", icon: "code-2",    order: 1 },
  { name: "DevOps",      slug: "devops",      icon: "server",    order: 2 },
  { name: "HR & Admin",  slug: "hr-admin",    icon: "users",     order: 3 },
  { name: "Finance",     slug: "finance",     icon: "dollar-sign", order: 4 },
  { name: "Marketing",   slug: "marketing",   icon: "megaphone", order: 5 },
] as const;

const APPS: {
  name: string;
  url: string;
  description: string;
  icon: string | null;
  categorySlug: string;
  isPinned?: boolean;
  order: number;
}[] = [
  // Development
  {
    name: "GitLab",
    url: "https://gitlab.internal",
    description: "Source code management",
    icon: "https://cdn.simpleicons.org/gitlab",
    categorySlug: "development",
    isPinned: true,
    order: 1,
  },
  {
    name: "Jira",
    url: "https://jira.internal",
    description: "Issue tracking",
    icon: "https://cdn.simpleicons.org/jira",
    categorySlug: "development",
    order: 2,
  },
  // DevOps
  {
    name: "Grafana",
    url: "https://grafana.internal",
    description: "Metrics dashboard",
    icon: "https://cdn.simpleicons.org/grafana",
    categorySlug: "devops",
    isPinned: true,
    order: 1,
  },
  {
    name: "Portainer",
    url: "https://portainer.internal",
    description: "Docker management",
    icon: "https://cdn.simpleicons.org/portainer",
    categorySlug: "devops",
    order: 2,
  },
  // HR & Admin
  {
    name: "HRM System",
    url: "https://hrm.internal",
    description: "Human resource management",
    icon: null,
    categorySlug: "hr-admin",
    order: 1,
  },
  {
    name: "Leave Tracker",
    url: "https://leave.internal",
    description: "Leave request management",
    icon: null,
    categorySlug: "hr-admin",
    order: 2,
  },
  // Finance
  {
    name: "Accounting",
    url: "https://accounting.internal",
    description: "Accounting software",
    icon: null,
    categorySlug: "finance",
    order: 1,
  },
  {
    name: "Expense Reports",
    url: "https://expense.internal",
    description: "Expense tracking",
    icon: null,
    categorySlug: "finance",
    order: 2,
  },
  // Marketing
  {
    name: "Analytics",
    url: "https://analytics.internal",
    description: "Web analytics",
    icon: "https://cdn.simpleicons.org/googleanalytics",
    categorySlug: "marketing",
    order: 1,
  },
  {
    name: "CMS",
    url: "https://cms.internal",
    description: "Content management",
    icon: null,
    categorySlug: "marketing",
    order: 2,
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed...\n");

  // -- Categories -----------------------------------------------------------
  console.log("Creating categories...");
  const categoryMap: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const record = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, order: cat.order },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, order: cat.order },
    });
    categoryMap[cat.slug] = record.id;
    console.log(`  ✓ ${record.name} (${record.id})`);
  }

  // -- Apps -----------------------------------------------------------------
  console.log("\nCreating apps...");
  for (const app of APPS) {
    const categoryId = categoryMap[app.categorySlug];
    const record = await db.app.upsert({
      where: { url: app.url },
      update: {
        name: app.name,
        description: app.description,
        icon: app.icon,
        isPinned: app.isPinned ?? false,
        order: app.order,
        categoryId,
      },
      create: {
        name: app.name,
        url: app.url,
        description: app.description,
        icon: app.icon,
        isPinned: app.isPinned ?? false,
        order: app.order,
        categoryId,
      },
    });
    console.log(`  ✓ ${record.name}`);
  }

  // -- Admin user -----------------------------------------------------------
  console.log("\nCreating users...");
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@internal.com" },
    update: { name: "Administrator", password: adminHash, role: "admin" },
    create: { email: "admin@internal.com", password: adminHash, name: "Administrator", role: "admin" },
  });
  console.log(`  ✓ ${admin.email} [admin]`);

  const memberHash = await bcrypt.hash("member123", 10);
  const alice = await db.user.upsert({
    where: { email: "alice@internal.com" },
    update: { name: "Alice", password: memberHash, role: "member" },
    create: { email: "alice@internal.com", password: memberHash, name: "Alice", role: "member" },
  });
  console.log(`  ✓ ${alice.email} [member]`);

  const bob = await db.user.upsert({
    where: { email: "bob@internal.com" },
    update: { name: "Bob", password: memberHash, role: "member" },
    create: { email: "bob@internal.com", password: memberHash, name: "Bob", role: "member" },
  });
  console.log(`  ✓ ${bob.email} [member]`);

  // -- Summary --------------------------------------------------------------
  const [catCount, appCount, userCount] = await Promise.all([
    db.category.count(),
    db.app.count(),
    db.user.count(),
  ]);

  console.log("\n✅ Seed complete:");
  console.log(`   Categories : ${catCount}`);
  console.log(`   Apps       : ${appCount}`);
  console.log(`   Users      : ${userCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
