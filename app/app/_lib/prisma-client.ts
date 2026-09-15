import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let prismaInstance: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    if (!prismaInstance) {
      prismaInstance = new PrismaClient();
    }
    return prismaInstance;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
