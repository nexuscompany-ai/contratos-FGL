import { prisma } from "../db";
import { sendPushToUser } from "./push";

/**
 * Dispara a notificação de "novo contrato pendente" pra todos os usuários
 * autorizados (hoje, qualquer login da equipe — o mesmo grupo que já vê
 * /contratos/pendentes) assim que o aceite do cliente é persistido.
 *
 * Idempotente por contrato: usa Contract.pushNotifiedAt como trava —
 * updateMany com where pushNotifiedAt: null só afeta a linha se ninguém
 * marcou antes, então um reload da página pública ou uma corrida entre
 * requisições nunca dispara duas vezes pro mesmo contrato.
 */
export async function notifyNovoContratoPendente(contractId: string, clienteNome: string) {
  const marcado = await prisma.contract.updateMany({
    where: { id: contractId, pushNotifiedAt: null },
    data: { pushNotifiedAt: new Date() },
  });
  if (marcado.count === 0) return; // já notificado (chamada duplicada)

  const usuarios = await prisma.user.findMany({ select: { id: true } });
  const url = `/contratos/${contractId}`;
  const title = "Novo contrato pendente";
  const body = `${clienteNome} acabou de assinar um contrato. Toque para visualizar e aprovar.`;

  await Promise.all(
    usuarios.map(async (u) => {
      await prisma.notification.create({
        data: { userId: u.id, type: "NOVO_CONTRATO_PENDENTE", title, body, contractId },
      });
      await sendPushToUser(u.id, { title, body, url, tag: `contrato-${contractId}` }, "NOVO_CONTRATO_PENDENTE", contractId);
    })
  );
}
