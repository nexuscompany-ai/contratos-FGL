import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { getVapidPublicKey, labelFromUserAgent, pushConfigurado, sendPushToUser } from "../services/push";

const router = Router();
router.use(requireAuth);

const testeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitos testes seguidos. Aguarde um pouco.",
});

router.get("/api/push/public-key", (req, res) => {
  res.json({ publicKey: getVapidPublicKey(), configurado: pushConfigurado });
});

/**
 * Registra (ou reativa) a Push Subscription deste dispositivo pro usuário
 * logado. Nunca sobrescreve a assinatura de outro dispositivo — cada
 * endpoint do navegador é único e vira sua própria linha.
 */
router.post("/api/push/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body?.subscription || req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ ok: false, erro: "Assinatura inválida." });
  }

  const userAgent = req.headers["user-agent"] || "";
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: req.session!.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      label: labelFromUserAgent(userAgent),
      active: true,
    },
    update: {
      userId: req.session!.userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      label: labelFromUserAgent(userAgent),
      active: true,
      lastUsedAt: new Date(),
    },
  });

  res.json({ ok: true });
});

router.post("/api/push/unsubscribe", async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ ok: false, erro: "endpoint ausente." });

  await prisma.pushSubscription.updateMany({
    where: { endpoint, userId: req.session!.userId },
    data: { active: false },
  });

  res.json({ ok: true });
});

router.post("/api/push/test", testeLimiter, async (req, res) => {
  if (!pushConfigurado) {
    return res.status(503).json({ ok: false, erro: "Notificações push não configuradas no servidor." });
  }

  const enviados = await sendPushToUser(
    req.session!.userId,
    {
      title: "Teste de notificação",
      body: "As notificações deste dispositivo estão funcionando corretamente.",
      url: "/configuracoes",
      tag: "teste",
    },
    "TESTE"
  );

  res.json({ ok: true, dispositivos: enviados });
});

router.get("/api/push/devices", async (req, res) => {
  const devices = await prisma.pushSubscription.findMany({
    where: { userId: req.session!.userId, active: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true, lastUsedAt: true },
  });
  res.json({ devices });
});

router.post("/api/push/devices/:id/desativar", async (req, res) => {
  await prisma.pushSubscription.updateMany({
    where: { id: req.params.id, userId: req.session!.userId },
    data: { active: false },
  });
  res.json({ ok: true });
});

router.get("/api/notifications", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.session!.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.session!.userId, readAt: null },
  });
  res.json({ notifications, unreadCount });
});

router.get("/api/notifications/unread-count", async (req, res) => {
  const unreadCount = await prisma.notification.count({
    where: { userId: req.session!.userId, readAt: null },
  });
  res.json({ unreadCount });
});

router.post("/api/notifications/:id/ler", async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.session!.userId },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

router.post("/api/notifications/ler-todas", async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.session!.userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

export default router;
