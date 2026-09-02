import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { renderContractPdf, sendPdfResponse } from "../services/pdf";
import { savePdfToBlob } from "../services/blob";
import { sweepContratosVencidos, estaPrestesAVencer, diasParaVencer, DIAS_VIGENCIA } from "../services/contractLifecycle";
import { sendBoasVindasEmail, sendCancelamentoEmail, sendLembrete30Email, sendVencimentoEmail } from "../services/email";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  await sweepContratosVencidos();

  const [ativos, pendentes, vencidos, todosAtivos] = await Promise.all([
    prisma.contract.count({ where: { status: "ATIVO" } }),
    prisma.contract.count({ where: { status: "PENDENTE" } }),
    prisma.contract.count({ where: { status: "VENCIDO" } }),
    prisma.contract.findMany({ where: { status: "ATIVO" }, select: { endDate: true } }),
  ]);

  const prestesAVencer = todosAtivos.filter((c) => estaPrestesAVencer(c.endDate, "ATIVO")).length;

  res.render("dashboard", {
    title: "Dashboard",
    stats: { ativos, pendentes, prestesAVencer, vencidos },
  });
});

/**
 * Diagnóstico manual: dispara os 4 templates de e-mail (boas-vindas,
 * lembrete 30 dias, lembrete de vencimento, cancelamento) com dados
 * fictícios pro endereço informado, pra confirmar que GMAIL_USER/
 * GMAIL_APP_PASSWORD estão configurados e o envio está funcionando.
 * Protegido por login (requireAuth já aplicado no router).
 */
router.get("/admin/testar-emails", async (req, res) => {
  const to = String(req.query.to || "").trim();
  if (!to) return res.status(400).send("Use /admin/testar-emails?to=seu@email.com");

  const dados = {
    clienteNome: "Contato de Teste",
    clienteEmail: to,
    tipoContrato: "Proteção Veicular",
    placa: "TST1A23",
    pdfUrl: `${process.env.BASE_URL || `${req.protocol}://${req.get("host")}`}/contrato/teste/pdf`,
  };

  await sendBoasVindasEmail({ ...dados, endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) });
  await sendLembrete30Email({ ...dados, endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
  await sendVencimentoEmail({ ...dados, endDate: new Date() });
  await sendCancelamentoEmail(dados);

  res.send(`4 e-mails de teste disparados para ${to}. Confira o console de logs (Vercel → Runtime Logs) se algum não chegar.`);
});

router.get("/contratos/novo", (req, res) => {
  res.render("contrato-novo", { title: "Enviar contrato" });
});

router.post("/contratos/novo", async (req, res) => {
  const { valorFipe, tipoContrato } = req.body;
  const exigeFipe = tipoContrato === "Proteção Veicular";
  const valor = Number(String(valorFipe || "").replace(/[^\d,]/g, "").replace(",", "."));

  if (!tipoContrato) {
    return res.status(400).render("contrato-novo", {
      title: "Enviar contrato",
      error: "Selecione o plano do contrato.",
    });
  }

  if (exigeFipe && (!valor || valor <= 0)) {
    return res.status(400).render("contrato-novo", {
      title: "Enviar contrato",
      error: "Informe um valor FIPE válido para o plano de Proteção Veicular.",
    });
  }

  const valorFinal = exigeFipe ? valor : 0;

  const token = nanoid(8);
  const contract = await prisma.contract.create({
    data: {
      token,
      tipoContrato,
      valorFipe: valorFinal,
      status: "GERADO",
      createdById: req.session?.userId,
    },
  });

  const pdfBytes = await renderContractPdf({
    contractId: contract.id,
    token: contract.token,
    tipoContrato: contract.tipoContrato,
    valorFipe: contract.valorFipe,
    status: contract.status,
    createdAt: contract.createdAt,
  });
  const pdfPath = await savePdfToBlob(`${contract.id}-gerado.pdf`, pdfBytes);
  await prisma.contract.update({ where: { id: contract.id }, data: { pdfPath } });

  res.redirect(`/contratos/${contract.id}/link`);
});

router.get("/contratos/:id/link", async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) return res.status(404).render("404", { title: "Não encontrado" });

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.render("contrato-link", {
    title: "Contrato gerado",
    contract,
    link: `${baseUrl}/contrato/${contract.token}`,
  });
});

/**
 * Filtro de busca por nome do cliente, CPF ou placa do veículo, usado em
 * todas as pastas de contratos (pendentes/ativos/prestes a vencer/vencidos).
 */
function contractSearch(q: string) {
  if (!q) return {};
  return {
    OR: [
      { client: { nomeCompleto: { contains: q, mode: "insensitive" as const } } },
      { client: { cpf: { contains: q.replace(/\D/g, "") } } },
      { vehicle: { placa: { contains: q.toUpperCase() } } },
    ],
  };
}

router.get("/contratos/pendentes", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const contratos = await prisma.contract.findMany({
    where: { status: "PENDENTE", ...contractSearch(q) },
    include: { client: true, vehicle: true },
    orderBy: { filledAt: "desc" },
  });
  res.render("contrato-lista", {
    title: "Contratos pendentes",
    heading: "Pendentes de aprovação",
    contratos,
    diasParaVencer,
    q,
  });
});

router.get("/contratos/ativos", async (req, res) => {
  await sweepContratosVencidos();
  const q = String(req.query.q || "").trim();
  const contratos = await prisma.contract.findMany({
    where: { status: "ATIVO", ...contractSearch(q) },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "asc" },
  });
  res.render("contrato-lista", { title: "Contratos ativos", heading: "Contratos ativos", contratos, diasParaVencer, q });
});

router.get("/contratos/prestes-a-vencer", async (req, res) => {
  await sweepContratosVencidos();
  const q = String(req.query.q || "").trim();
  const ativos = await prisma.contract.findMany({
    where: { status: "ATIVO", ...contractSearch(q) },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "asc" },
  });
  const contratos = ativos.filter((c) => estaPrestesAVencer(c.endDate, "ATIVO"));
  res.render("contrato-lista", { title: "Prestes a vencer", heading: "Prestes a vencer (≤ 30 dias)", contratos, diasParaVencer, q });
});

router.get("/contratos/vencidos", async (req, res) => {
  await sweepContratosVencidos();
  const q = String(req.query.q || "").trim();
  const contratos = await prisma.contract.findMany({
    where: { status: "VENCIDO", ...contractSearch(q) },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "desc" },
  });
  res.render("contrato-lista", { title: "Contratos vencidos", heading: "Contratos vencidos", contratos, diasParaVencer, q });
});

router.get("/contratos/cancelados", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const contratos = await prisma.contract.findMany({
    where: { status: "CANCELADO", ...contractSearch(q) },
    include: { client: true, vehicle: true },
    orderBy: { cancelledAt: "desc" },
  });
  res.render("contrato-lista", { title: "Contratos cancelados", heading: "Contratos cancelados", contratos, diasParaVencer, q });
});

router.get("/contratos/:id/pdf", async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract || !contract.pdfPath) return res.status(404).send("PDF não disponível.");
  sendPdfResponse(res, contract.pdfPath);
});

router.get("/contratos/:id", async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { client: true, vehicle: true, acceptance: true, approvedBy: true, createdBy: true },
  });
  if (!contract) return res.status(404).render("404", { title: "Não encontrado" });

  res.render("contrato-detalhe", {
    title: "Contrato",
    contract,
    prestesAVencer: estaPrestesAVencer(contract.endDate, contract.status),
  });
});

router.post("/contratos/:id/aprovar", async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { client: true, vehicle: true, acceptance: true },
  });
  if (!contract) return res.status(404).render("404", { title: "Não encontrado" });
  if (contract.status !== "PENDENTE") {
    return res.redirect(`/contratos/${contract.id}`);
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);

  const pdfBytes = await renderContractPdf({
    contractId: contract.id,
    token: contract.token,
    tipoContrato: contract.tipoContrato,
    valorFipe: contract.valorFipe,
    status: "ATIVO",
    createdAt: contract.createdAt,
    cliente: contract.client,
    veiculo: contract.vehicle,
    aceite: contract.acceptance,
    vigencia: { startDate, endDate },
  });
  const pdfPath = await savePdfToBlob(`${contract.id}-final.pdf`, pdfBytes);

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "ATIVO",
      approvedAt: new Date(),
      approvedById: req.session?.userId,
      startDate,
      endDate,
      pdfPath,
    },
  });

  if (contract.client?.email) {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    await sendBoasVindasEmail({
      clienteNome: contract.client.nomeCompleto,
      clienteEmail: contract.client.email,
      tipoContrato: contract.tipoContrato,
      placa: contract.vehicle?.placa,
      endDate,
      pdfUrl: `${baseUrl}/contrato/${contract.token}/pdf`,
    });
    await prisma.contract.update({ where: { id: contract.id }, data: { boasVindasEmailSentAt: new Date() } });
  }

  res.redirect(`/contratos/${contract.id}`);
});

router.post("/contratos/:id/cancelar", async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { client: true, vehicle: true },
  });
  if (!contract) return res.status(404).render("404", { title: "Não encontrado" });
  if (!["GERADO", "PENDENTE", "ATIVO"].includes(contract.status)) {
    return res.redirect(`/contratos/${contract.id}`);
  }

  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "CANCELADO", cancelledAt: new Date() },
  });

  if (contract.client?.email) {
    await sendCancelamentoEmail({
      clienteNome: contract.client.nomeCompleto,
      clienteEmail: contract.client.email,
      tipoContrato: contract.tipoContrato,
      placa: contract.vehicle?.placa,
    });
  }

  res.redirect(`/contratos/${contract.id}`);
});

router.get("/clientes", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const clientes = q
    ? await prisma.client.findMany({
        where: {
          OR: [
            { nomeCompleto: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q.replace(/\D/g, "") } },
            { contracts: { some: { vehicle: { placa: { contains: q.toUpperCase() } } } } },
          ],
        },
        include: { contracts: { include: { vehicle: true }, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.client.findMany({
        include: { contracts: { include: { vehicle: true }, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

  res.render("clientes", { title: "Clientes", clientes, q });
});

router.get("/clientes/:id", async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: { contracts: { include: { vehicle: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!client) return res.status(404).render("404", { title: "Não encontrado" });

  res.render("cliente-detalhe", { title: client.nomeCompleto, client });
});

export default router;
