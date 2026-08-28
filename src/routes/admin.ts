import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { renderContractPdf, sendPdfResponse } from "../services/pdf";
import { savePdfToBlob } from "../services/blob";
import { sweepContratosVencidos, estaPrestesAVencer, diasParaVencer, DIAS_VIGENCIA } from "../services/contractLifecycle";

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

router.get("/contratos/novo", (req, res) => {
  res.render("contrato-novo", { title: "Enviar contrato" });
});

router.post("/contratos/novo", async (req, res) => {
  const { valorFipe, tipoContrato } = req.body;
  const valor = Number(String(valorFipe).replace(/[^\d.,]/g, "").replace(",", "."));

  if (!valor || valor <= 0 || !tipoContrato) {
    return res.status(400).render("contrato-novo", {
      title: "Enviar contrato",
      error: "Informe um valor FIPE válido e o tipo de contrato.",
    });
  }

  const token = nanoid(8);
  const contract = await prisma.contract.create({
    data: {
      token,
      tipoContrato,
      valorFipe: valor,
      status: "GERADO",
      createdById: req.session.userId,
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

router.get("/contratos/pendentes", async (req, res) => {
  const contratos = await prisma.contract.findMany({
    where: { status: "PENDENTE" },
    include: { client: true, vehicle: true },
    orderBy: { filledAt: "desc" },
  });
  res.render("contrato-lista", {
    title: "Contratos pendentes",
    heading: "Pendentes de aprovação",
    contratos,
    diasParaVencer,
  });
});

router.get("/contratos/ativos", async (req, res) => {
  await sweepContratosVencidos();
  const contratos = await prisma.contract.findMany({
    where: { status: "ATIVO" },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "asc" },
  });
  res.render("contrato-lista", { title: "Contratos ativos", heading: "Contratos ativos", contratos, diasParaVencer });
});

router.get("/contratos/prestes-a-vencer", async (req, res) => {
  await sweepContratosVencidos();
  const ativos = await prisma.contract.findMany({
    where: { status: "ATIVO" },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "asc" },
  });
  const contratos = ativos.filter((c) => estaPrestesAVencer(c.endDate, "ATIVO"));
  res.render("contrato-lista", { title: "Prestes a vencer", heading: "Prestes a vencer (≤ 30 dias)", contratos, diasParaVencer });
});

router.get("/contratos/vencidos", async (req, res) => {
  await sweepContratosVencidos();
  const contratos = await prisma.contract.findMany({
    where: { status: "VENCIDO" },
    include: { client: true, vehicle: true },
    orderBy: { endDate: "desc" },
  });
  res.render("contrato-lista", { title: "Contratos vencidos", heading: "Contratos vencidos", contratos, diasParaVencer });
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
      approvedById: req.session.userId,
      startDate,
      endDate,
      pdfPath,
    },
  });

  // Envio de e-mail ao cliente fica pendente de configuração de SMTP; registrado no log por ora.
  console.log(`[email] Contrato ${contract.id} aprovado — enviar PDF final para ${contract.client?.email}`);

  res.redirect(`/contratos/${contract.id}`);
});

router.get("/clientes", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const clientes = q
    ? await prisma.client.findMany({
        where: {
          OR: [
            { nomeCompleto: { contains: q } },
            { cpf: { contains: q } },
            { contracts: { some: { vehicle: { placa: { contains: q.toUpperCase() } } } } },
          ],
        },
        include: { contracts: { include: { vehicle: true } } },
        orderBy: { createdAt: "desc" },
      })
    : await prisma.client.findMany({
        include: { contracts: { include: { vehicle: true } } },
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
