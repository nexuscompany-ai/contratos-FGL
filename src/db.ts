import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL) {
    // Em produção na Vercel, a ausência de DATABASE_URL é um erro de
    // configuração (falta conectar o Postgres em Storage), não um sinal
    // para cair silenciosamente num banco demo que não persiste dados.
    throw new Error(
      "DATABASE_URL não configurada. Conecte um banco Postgres ao projeto em " +
        "Vercel → Storage → Create Database, ou defina DATABASE_URL manualmente."
    );
  }
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma = new PrismaClient();
