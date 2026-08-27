import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@fgl.com.br";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin já existe: ${email}`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD || "mudar123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "Administrador FGL",
      email,
      password: hash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin criado: ${email} / senha: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
