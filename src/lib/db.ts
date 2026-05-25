import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

const getPrismaClient = () => {
  const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === "production") {
  prismaInstance = getPrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = getPrismaClient();
  }
  prismaInstance = globalForPrisma.prisma;
}

export const db = prismaInstance;
