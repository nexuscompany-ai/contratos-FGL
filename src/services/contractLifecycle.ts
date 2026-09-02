import { prisma } from "../db";
import { sendLembrete30Email, sendVencimentoEmail } from "./email";

export const DIAS_ALERTA_VENCIMENTO = 30;
export const DIAS_VIGENCIA = 365;

function baseUrl(): string {
  return process.env.BASE_URL || "https://contratos-fgl.vercel.app";
}

/**
 * Contratos ATIVO cuja data de vencimento já passou viram VENCIDO, e os
 * lembretes de vencimento (30 dias antes / no dia) são enviados por e-mail.
 * Não há cron dedicado: isso roda toda vez que alguém acessa uma lista de
 * contratos, o que é suficiente pra não deixar lembretes represados por
 * muito tempo. Cada e-mail só é enviado uma vez por contrato (marcado no
 * banco), mesmo que a função rode várias vezes por dia.
 */
export async function sweepContratosVencidos() {
  const agora = new Date();

  const prestesA30Dias = await prisma.contract.findMany({
    where: {
      status: "ATIVO",
      lembrete30EmailSentAt: null,
      endDate: { lte: new Date(agora.getTime() + DIAS_ALERTA_VENCIMENTO * 24 * 60 * 60 * 1000), gte: agora },
    },
    include: { client: true, vehicle: true },
  });
  for (const c of prestesA30Dias) {
    if (!c.client?.email || !c.endDate) continue;
    await sendLembrete30Email({
      clienteNome: c.client.nomeCompleto,
      clienteEmail: c.client.email,
      tipoContrato: c.tipoContrato,
      placa: c.vehicle?.placa,
      endDate: c.endDate,
      pdfUrl: `${baseUrl()}/contrato/${c.token}/pdf`,
    });
    await prisma.contract.update({ where: { id: c.id }, data: { lembrete30EmailSentAt: agora } });
  }

  const vencendoHoje = await prisma.contract.findMany({
    where: { status: "ATIVO", vencimentoEmailSentAt: null, endDate: { lt: agora } },
    include: { client: true, vehicle: true },
  });
  for (const c of vencendoHoje) {
    if (c.client?.email && c.endDate) {
      await sendVencimentoEmail({
        clienteNome: c.client.nomeCompleto,
        clienteEmail: c.client.email,
        tipoContrato: c.tipoContrato,
        placa: c.vehicle?.placa,
        endDate: c.endDate,
        pdfUrl: `${baseUrl()}/contrato/${c.token}/pdf`,
      });
    }
    await prisma.contract.update({ where: { id: c.id }, data: { vencimentoEmailSentAt: agora } });
  }

  await prisma.contract.updateMany({
    where: { status: "ATIVO", endDate: { lt: agora } },
    data: { status: "VENCIDO" },
  });
}

export function diasParaVencer(endDate: Date): number {
  const ms = endDate.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function estaPrestesAVencer(endDate: Date | null, status: string): boolean {
  if (status !== "ATIVO" || !endDate) return false;
  const dias = diasParaVencer(endDate);
  return dias >= 0 && dias <= DIAS_ALERTA_VENCIMENTO;
}
