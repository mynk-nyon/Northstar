import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Support for serverless ephemeral filesystem on Vercel
if (process.env.VERCEL) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("./dev.db")) {
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
