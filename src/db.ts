import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.VERCEL ? "file:/tmp/demo.db" : "file:./dev.db";
}

export const prisma = new PrismaClient();
