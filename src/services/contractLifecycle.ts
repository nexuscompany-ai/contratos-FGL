import { prisma } from "../db";

export const DIAS_ALERTA_VENCIMENTO = 30;
export const DIAS_VIGENCIA = 365;

/**
 * Contratos ATIVO cuja data de vencimento já passou viram VENCIDO.
 * Chamado antes de qualquer listagem que dependa do status atual.
 */
export async function sweepContratosVencidos() {
  const agora = new Date();
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
