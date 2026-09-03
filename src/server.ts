import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieSession from "cookie-session";
import helmet from "helmet";
import path from "path";

import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import publicRoutes from "./routes/public";
import pushRoutes from "./routes/push";
import { ensureDatabaseReady } from "./db-bootstrap";
import { formatCpf } from "./utils/format";
import { sweepContratosVencidos } from "./services/contractLifecycle";

const app = express();
const emProducao = Boolean(process.env.VERCEL);

// A Vercel entrega a requisição através de um proxy — sem isso, req.ip e
// req.protocol (usados pelo rate limit e pelos cookies "secure") enxergam
// o proxy em vez do cliente/protocolo reais.
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));
app.locals.formatCpf = formatCpf;

/**
 * Cabeçalhos de segurança padrão (helmet). CSP customizado porque o app usa
 * <script>/style inline nas views (não é um bug a corrigir agora — reescrever
 * tudo pra nonce seria um refactor grande e arriscado) — então script-src e
 * style-src precisam de 'unsafe-inline'. Mesmo assim, o resto da política já
 * fecha as portas mais perigosas: nenhum recurso de fora do site, sem
 * embutir o site em iframe de terceiro (clickjacking), sem <object>/<embed>,
 * sem trocar a <base> da página.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false, // quebraria o carregamento do Google Fonts sem ganho real de segurança aqui
    hsts: emProducao ? undefined : false, // só força HTTPS em produção; nunca em dev local
  })
);
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
});

app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));
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
    httpOnly: true,
    sameSite: "lax", // já neutraliza CSRF em POST/fetch vindo de outro site — cookie "lax" nunca acompanha essas requisições
    secure: emProducao,
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
  // O detalhe do erro (mensagem, stack, o que for) só vai pro log do
  // servidor — nunca pra resposta. Antes disso vazava err.message direto
  // pro cliente, o que pode expor detalhe interno (nome de tabela, biblioteca
  // usada, caminho de arquivo) útil pra quem estiver tentando atacar o site.
  console.error(err);
  res.status(500).send("Erro interno. Tente novamente em instantes.");
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`FGL Contratos rodando em http://localhost:${port}`);
  });
}

export default app;
