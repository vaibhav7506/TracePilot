import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In development Next.js hot-reloads modules, which would otherwise spawn a new
 * PrismaClient (and a new connection pool) on every reload. Caching it on
 * `globalThis` keeps a single instance across reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
