import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Support for serverless ephemeral filesystem on Netlify, Vercel, and AWS Lambda
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);

if (isServerless) {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:/tmp/")) {
    process.env.DATABASE_URL = "file:/tmp/dev.db";
  }
  const tmpDbPath = "/tmp/dev.db";
  const localDb = path.join(process.cwd(), "prisma", "dev.db");
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDb)) {
    try {
      fs.copyFileSync(localDb, tmpDbPath);
    } catch {
      // Auto-seeder in repository handles empty database
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Self-healing schema initializer for serverless environments (Netlify / Vercel).
 * Ensures tables exist in /tmp/dev.db even on brand-new ephemeral execution containers.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Event" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "location" TEXT NOT NULL,
      "guestCount" INTEGER NOT NULL,
      "totalBudget" REAL NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "venueCapacity" INTEGER,
      "venueType" TEXT NOT NULL DEFAULT 'indoor',
      "venueHours" INTEGER,
      "cateringRestrictions" TEXT,
      "priorities" TEXT NOT NULL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BudgetCategory" (
      "id" TEXT PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "categoryKey" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "allocatedAmount" REAL NOT NULL,
      "committedAmount" REAL NOT NULL DEFAULT 0,
      "isManualOverride" BOOLEAN NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "BudgetCategory_eventId_categoryKey_key" 
    ON "BudgetCategory"("eventId", "categoryKey");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Task" (
      "id" TEXT PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "dueDate" DATETIME NOT NULL,
      "categoryKey" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'todo',
      "owner" TEXT,
      "phase" TEXT NOT NULL DEFAULT 'one_month',
      "dependencyLinks" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Vendor" (
      "id" TEXT PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "categoryKey" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "contact" TEXT NOT NULL,
      "quoteAmount" REAL NOT NULL DEFAULT 0,
      "depositAmount" REAL NOT NULL DEFAULT 0,
      "balanceDue" REAL NOT NULL DEFAULT 0,
      "contractStatus" TEXT NOT NULL DEFAULT 'contacted',
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE
    );
  `);
}
