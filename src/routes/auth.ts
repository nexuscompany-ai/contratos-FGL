import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db";

const router = Router();

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login", { title: "Entrar", error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: String(email || "").trim().toLowerCase() } });

  if (!user || !(await bcrypt.compare(String(password || ""), user.password))) {
    return res.status(401).render("login", { title: "Entrar", error: "E-mail ou senha inválidos." });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userRole = user.role;
  res.redirect("/");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

export default router;
