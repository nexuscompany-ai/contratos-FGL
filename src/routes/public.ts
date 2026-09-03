import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { renderContractPdf, sendPdfResponse } from "../services/pdf";
import { savePdfToBlob } from "../services/blob";
import { clausulasComValorFipe, PREAMBULO, TEXTO_ACEITE, CONTRATADA } from "../services/contractTerms";
import { isValidCpf } from "../utils/format";
import { notifyNovoContratoPendente } from "../services/notifications";

const router = Router();

/**
 * O link do contrato é público (sem login, por design) — esse limite não é
 * pra travar o cliente legítimo (nunca vai chegar perto disso preenchendo
 * um formulário), é pra frear alguém tentando adivinhar tokens de outros
 * contratos ou automatizar envios repetidos.
 */
const contratoPublicoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Muitas requisições. Aguarde alguns minutos e tente de novo.",
});
router.use("/contrato/:token", contratoPublicoLimiter);

router.get("/contrato/:token", async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { token: req.params.token },
    include: { client: true, vehicle: true, acceptance: true },
  });
  if (!contract) return res.status(404).render("404", { title: "Contrato não encontrado" });

  if (contract.status === "GERADO") {
    return res.render("publico-formulario", {
      title: "Contrato FGL",
      contract,
      error: null,
      old: null,
      clausulas: clausulasComValorFipe(contract.valorFipe),
      preambulo: PREAMBULO,
      textoAceite: TEXTO_ACEITE,
      contratada: CONTRATADA,
    });
  }

  return res.render("publico-status", { title: "Contrato FGL", contract });
});

router.post("/contrato/:token", async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { token: req.params.token } });
  if (!contract) return res.status(404).render("404", { title: "Contrato não encontrado" });
  if (contract.status !== "GERADO") {
    return res.render("publico-status", {
      title: "Contrato FGL",
      contract: await prisma.contract.findUnique({
        where: { id: contract.id },
        include: { client: true, vehicle: true, acceptance: true },
      }),
    });
  }

  const b = req.body;
  const required = ["nomeCompleto", "telefone", "email", "placa", "modelo", "ano"];
  const missing = required.filter((f) => !String(b[f] || "").trim());
  const aceite = b.aceite === "on";
  const cpfDigits = (b.cpf || "").replace(/\D/g, "");
  const cpfInvalido = cpfDigits.length > 0 && !isValidCpf(cpfDigits);

  if (missing.length > 0 || !aceite || cpfInvalido) {
    let error = "Preencha todos os campos obrigatórios.";
    if (cpfInvalido) error = "CPF inválido. Confira os números digitados.";
    if (!aceite) error = "É necessário aceitar os termos do contrato para continuar.";

    return res.status(400).render("publico-formulario", {
      title: "Contrato FGL",
      contract,
      error,
      old: b,
      clausulas: clausulasComValorFipe(contract.valorFipe),
      preambulo: PREAMBULO,
      textoAceite: TEXTO_ACEITE,
      contratada: CONTRATADA,
    });
  }

  const client = await prisma.client.create({
    data: {
      nomeCompleto: b.nomeCompleto.trim(),
      cpf: cpfDigits,
      dataNascimento: (b.dataNascimento || "").trim() || null,
      telefone: b.telefone.trim(),
      email: b.email.trim(),
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      placa: b.placa.trim().toUpperCase(),
      renavam: (b.renavam || "").trim() || null,
      chassi: (b.chassi || "").trim() || null,
      modelo: b.modelo.trim(),
      marca: (b.marca || "").trim() || null,
      ano: b.ano.trim(),
      valorFipe: contract.valorFipe,
    },
  });

  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

  await prisma.acceptance.create({
    data: { contractId: contract.id, ip, userAgent: req.headers["user-agent"] || "" },
  });

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { clientId: client.id, vehicleId: vehicle.id, status: "PENDENTE", filledAt: new Date() },
  });

  // Aceite já confirmado e persistido (status PENDENTE gravado acima) —
  // agora sim disparamos a notificação Push aos gestores. Aguardamos aqui
  // porque a função serverless pode ser congelada assim que a resposta for
  // enviada; nunca deixamos isso quebrar a resposta ao cliente.
  try {
    await notifyNovoContratoPendente(updated.id, client.nomeCompleto);
  } catch (err) {
    console.error("Falha ao notificar novo contrato pendente:", err);
  }

  const acceptance = await prisma.acceptance.findUnique({ where: { contractId: contract.id } });
  const pdfBytes = await renderContractPdf({
    contractId: updated.id,
    token: updated.token,
    tipoContrato: updated.tipoContrato,
    valorFipe: updated.valorFipe,
    status: updated.status,
    createdAt: updated.createdAt,
    cliente: client,
    veiculo: vehicle,
    aceite: acceptance,
  });
  const pdfPath = await savePdfToBlob(`${updated.id}-pendente.pdf`, pdfBytes);
  await prisma.contract.update({ where: { id: updated.id }, data: { pdfPath } });

  res.render("publico-status", {
    title: "Contrato FGL",
    contract: await prisma.contract.findUnique({
      where: { id: updated.id },
      include: { client: true, vehicle: true, acceptance: true },
    }),
  });
});

router.get("/contrato/:token/pdf", async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { token: req.params.token } });
  if (!contract || !contract.pdfPath) return res.status(404).send("PDF não disponível.");
  sendPdfResponse(res, contract.pdfPath);
});

export default router;
