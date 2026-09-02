import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieSession from "cookie-session";
import path from "path";

import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import publicRoutes from "./routes/public";
import pushRoutes from "./routes/push";
import { ensureDatabaseReady } from "./db-bootstrap";
import { formatCpf } from "./utils/format";
import { sweepContratosVencidos } from "./services/contractLifecycle";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));
app.locals.formatCpf = formatCpf;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "src", "public")));

const dbReady = ensureDatabaseReady();
app.use((req, res, next) => {
  dbReady.then(() => next(), next);
});

app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "dev-secret"],
    maxAge: 1000 * 60 * 60 * 24 * 30,
  })
);

app.use((req, res, next) => {
  res.locals.userName = req.session?.userName;
  next();
});

/**
 * Disparado uma vez por dia pelo cron da Vercel (vercel.json) — garante que
 * os lembretes de vencimento saiam mesmo se ninguém abrir o painel naquele
 * dia. Protegido por CRON_SECRET: a Vercel envia esse valor automaticamente
 * como "Authorization: Bearer <CRON_SECRET>" quando a variável existe. Sem
 * CRON_SECRET configurada, roda sem checar (ainda funciona, só não é
 * exclusivo do cron) — configure a variável no painel da Vercel.
 */
app.get("/api/cron/lembretes", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).send("unauthorized");
  }
  await sweepContratosVencidos();
  res.status(200).send("ok");
});

app.use("/", publicRoutes);
app.use("/", authRoutes);
app.use("/", pushRoutes);
app.use("/", adminRoutes);

app.use((req, res) => {
  res.status(404).render("404", { title: "Não encontrado" });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).send(`Erro interno: ${err.message}`);
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`FGL Contratos rodando em http://localhost:${port}`);
  });
}

export default app;
