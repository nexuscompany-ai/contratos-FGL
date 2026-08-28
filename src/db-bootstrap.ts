import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

let ready: Promise<void> | null = null;

/**
 * Modo demo: quando DATABASE_URL aponta pra um arquivo SQLite (não um
 * Postgres real configurado), garante que as tabelas existem e que há um
 * usuário admin, sem exigir nenhum passo manual (migrate/seed). Em /tmp na
 * Vercel isso é refeito a cada cold start, então os dados não persistem
 * entre deploys/reinícios — é só para navegar pela plataforma.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (!process.env.DATABASE_URL?.startsWith("file:")) {
    return Promise.resolve();
  }
  if (!ready) {
    ready = bootstrap();
  }
  return ready;
}

async function bootstrap() {
  if (!(await hasTables())) {
    await applyMigrations();
  }
  await ensureAdmin();
}

async function hasTables(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "User" LIMIT 1');
    return true;
  } catch {
    return false;
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const folders = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const folder of folders) {
    const sql = fs.readFileSync(path.join(migrationsDir, folder, "migration.sql"), "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@fgl.com.br").trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "Administrador FGL",
      email,
      password: hash,
      role: "ADMIN",
    },
  });
}
