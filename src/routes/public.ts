import { Router } from "express";
import { prisma } from "../db";
import { renderContractPdf, sendPdfResponse } from "../services/pdf";
import { savePdfToBlob } from "../services/blob";
import { CLAUSULAS, PREAMBULO, TEXTO_ACEITE, CONTRATADA } from "../services/contractTerms";

const router = Router();

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
      clausulas: CLAUSULAS,
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
  const required = ["nomeCompleto", "rua", "cidade", "estado", "telefone", "email", "placa", "modelo", "ano"];
  const missing = required.filter((f) => !String(b[f] || "").trim());
  const aceite = b.aceite === "on";

  if (missing.length > 0 || !aceite) {
    return res.status(400).render("publico-formulario", {
      title: "Contrato FGL",
      contract,
      error: !aceite
        ? "É necessário aceitar os termos do contrato para continuar."
        : "Preencha todos os campos obrigatórios.",
      old: b,
      clausulas: CLAUSULAS,
      preambulo: PREAMBULO,
      textoAceite: TEXTO_ACEITE,
      contratada: CONTRATADA,
    });
  }

  const endereco = [b.rua, b.bairro, b.cidade, b.estado, b.cep, b.pais || "Brasil"].filter(Boolean).join(", ");

  const client = await prisma.client.create({
    data: {
      nomeCompleto: b.nomeCompleto.trim(),
      cpf: (b.cpf || "").trim(),
      dataNascimento: (b.dataNascimento || "").trim() || null,
      endereco,
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
