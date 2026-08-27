import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import path from "path";

import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import publicRoutes from "./routes/public";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "src", "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use((req, res, next) => {
  res.locals.userName = req.session.userName;
  next();
});

app.use("/", publicRoutes);
app.use("/", authRoutes);
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
