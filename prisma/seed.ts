import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(name: string, email: string, password: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário já existe: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hash, role } });
  console.log(`Usuário criado: ${email} / senha: ${password}`);
}

/**
 * Senha compartilhada por todos os logins de equipe (admin, Felipe, Gabriel)
 * — a mesma configurada via ADMIN_PASSWORD, a pedido do dono do produto.
 */
async function main() {
  const password = process.env.ADMIN_PASSWORD || "mudar123";

  await ensureUser(process.env.ADMIN_NAME || "Administrador FGL", process.env.ADMIN_EMAIL || "admin@fgl.com.br", password, Role.ADMIN);
  await ensureUser("Felipe", process.env.FELIPE_EMAIL || "felipe@fgl.com.br", password, Role.FUNCIONARIO);
  await ensureUser("Gabriel", process.env.GABRIEL_EMAIL || "gabriel@fgl.com.br", password, Role.FUNCIONARIO);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
