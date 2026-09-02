import webpush from "web-push";
import { prisma } from "../db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:fglcontratos@gmail.com";

export const pushConfigurado = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (pushConfigurado) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Nome amigável do dispositivo a partir do User-Agent, só pra exibir em
 * "Meus dispositivos" — nada sensível é armazenado além disso.
 */
export function labelFromUserAgent(userAgent: string | undefined | null): string {
  const ua = userAgent || "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Computador (Windows)";
  if (/Linux/i.test(ua)) return "Computador (Linux)";
  return "Dispositivo";
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

type EnviarResultado = { ok: boolean; removida?: boolean; erro?: string };

/**
 * Envia um push para uma única subscription. Em erro 404/410 (endpoint não
 * existe mais — usuário desinstalou o app, revogou permissão etc.) desativa
 * a subscription em vez de insistir indefinidamente.
 */
async function enviarParaSubscription(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<EnviarResultado> {
  if (!pushConfigurado) return { ok: false, erro: "VAPID não configurado" };

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastUsedAt: new Date() } });
    return { ok: true };
  } catch (err: any) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { active: false } });
      return { ok: false, removida: true, erro: `HTTP ${status}` };
    }
    return { ok: false, erro: err?.message || String(err) };
  }
}

/**
 * Dispara o push para todos os dispositivos ativos de um usuário e registra
 * cada tentativa em PushLog (pra diagnosticar "por que não recebi").
 */
export async function sendPushToUser(userId: string, payload: PushPayload, event: string, contractId?: string) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId, active: true } });

  for (const sub of subs) {
    const resultado = await enviarParaSubscription(sub, payload);
    await prisma.pushLog.create({
      data: {
        subscriptionId: sub.id,
        userId,
        contractId: contractId || null,
        event,
        status: resultado.ok ? "ENVIADO" : resultado.removida ? "REMOVIDO_INVALIDO" : "ERRO",
        erro: resultado.erro || null,
      },
    });
  }

  return subs.length;
}
