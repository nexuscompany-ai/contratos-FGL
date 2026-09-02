import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";

const router = Router();

/**
 * Só aceita redirecionar de volta para um caminho local (começando com uma
 * única "/") — nunca para uma URL externa, mesmo que alguém manipule o
 * parâmetro. Usado pra voltar direto ao contrato depois do login quando o
 * clique veio de uma notificação Push com o usuário deslogado.
 */
function redirectSeguro(valor: unknown): string {
  const v = String(valor || "");
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return "/";
}

router.get("/login", (req, res) => {
  const redirect = redirectSeguro(req.query.redirect);
  if (req.session?.userId) return res.redirect(redirect);
  res.render("login", { title: "Entrar", error: null, redirect });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const redirect = redirectSeguro(req.body.redirect);
  const user = await prisma.user.findUnique({ where: { email: String(email || "").trim().toLowerCase() } });

  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return res.status(401).render("login", { title: "Entrar", error: "E-mail ou senha inválidos.", redirect });
  }

  req.session!.userId = user.id;
  req.session!.userName = user.name;
  req.session!.userRole = user.role;
  res.redirect(redirect);
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

export default router;
