import fs from "fs";
import nodemailer from "nodemailer";
import { prisma } from "../db";

const BRAND = "FGL Contratos";
const ORANGE = "#fd5f00";
const CONTACT_PHONE = "(11) 97100-0304";
const CONTACT_INSTAGRAM = "@fglbrasil";
const MAX_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Transporte SMTP — host/porta explícitos do Gmail, TLS implícito (porta 465),
// autenticado com a senha de app (nunca a senha principal da conta Google).
// Credenciais só existem como variável de ambiente do backend: nunca chegam
// ao frontend, a nenhuma resposta de API, a log ou ao banco de dados.
// ---------------------------------------------------------------------------
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // TLS implícito na conexão (recomendado pelo Gmail para senha de app)
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function fromHeader(): string {
  return `"${BRAND}" <${process.env.GMAIL_USER}>`;
}

function replyToHeader(): string {
  // Mesmo endereço usado pra enviar, salvo se um endereço de atendimento
  // específico for configurado em EMAIL_REPLY_TO.
  return process.env.EMAIL_REPLY_TO || process.env.GMAIL_USER || "";
}

// ---------------------------------------------------------------------------
// Layout: identidade visual discreta (faixa colorida com o nome da marca,
// não uma imagem única substituindo o conteúdo) + rodapé de contato. Todo
// texto importante existe como texto real, nunca só dentro de uma imagem.
// ---------------------------------------------------------------------------
function layoutHtml(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#fafafa; padding:24px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e7e5e2;">
      <div style="background:${ORANGE}; padding:20px 28px;">
        <span style="color:#ffffff; font-size:17px; font-weight:bold;">${BRAND}</span>
      </div>
      <div style="padding:28px;">
        <h1 style="font-size:18px; color:#171717; margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px; border-top:1px solid #e7e5e2;">
        <table role="presentation" style="font-size:12.5px; color:#737373; border-collapse:collapse;">
          <tr>
            <td style="padding:2px 8px 2px 0; font-weight:bold; color:#171717;">Atendimento</td>
            <td style="padding:2px 0;">${CONTACT_PHONE}</td>
          </tr>
          <tr>
            <td style="padding:2px 8px 2px 0; font-weight:bold; color:#171717;">Instagram</td>
            <td style="padding:2px 0;">${CONTACT_INSTAGRAM}</td>
          </tr>
          <tr>
            <td style="padding:2px 8px 2px 0; font-weight:bold; color:#171717;">E-mail</td>
            <td style="padding:2px 0;">${process.env.GMAIL_USER || ""}</td>
          </tr>
        </table>
        <p style="font-size:11px; color:#a3a3a3; margin:12px 0 0;">
          FGL Serviço de Vigilância Patrimonial e Terceirização Ltda
        </p>
      </div>
    </div>
  </div>`;
}

function paragraph(text: string): string {
  return `<p style="font-size:14px; line-height:1.6; color:#333333; margin:0 0 14px;">${text}</p>`;
}

function textLink(label: string, url: string): string {
  return `<p style="font-size:14px; margin:0 0 14px;"><a href="${url}" style="color:${ORANGE}; font-weight:bold;">${label}</a></p>`;
}

interface DetailRow {
  label: string;
  value: string;
}

function detailsTableHtml(rows: DetailRow[]): string {
  const filled = rows.filter((r) => r.value);
  if (filled.length === 0) return "";
  return (
    `<table role="presentation" style="width:100%; border-collapse:collapse; margin:4px 0 18px;">` +
    filled
      .map(
        (r) =>
          `<tr><td style="padding:5px 12px 5px 0; font-size:13px; color:#737373; white-space:nowrap; vertical-align:top;">${r.label}</td>` +
          `<td style="padding:5px 0; font-size:13px; color:#171717; font-weight:600;">${r.value}</td></tr>`
      )
      .join("") +
    `</table>`
  );
}

function detailsTableText(rows: DetailRow[]): string {
  return rows
    .filter((r) => r.value)
    .map((r) => `${r.label}: ${r.value}`)
    .join("\n");
}

function textFooter(): string {
  return (
    `\n--\n${BRAND}\n` +
    `Atendimento: ${CONTACT_PHONE}\n` +
    `Instagram: ${CONTACT_INSTAGRAM}\n` +
    `E-mail: ${process.env.GMAIL_USER || ""}\n` +
    `FGL Serviço de Vigilância Patrimonial e Terceirização Ltda`
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

// ---------------------------------------------------------------------------
// Anexo do PDF: busca os bytes a partir do pdfPath salvo no contrato (URL do
// Vercel Blob em produção, ou caminho local em disco no fallback sem Blob).
// Nome de arquivo profissional em vez de "document.pdf"/"file.pdf".
// ---------------------------------------------------------------------------
async function fetchPdfBytes(pdfPath: string): Promise<Buffer> {
  if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
    const res = await fetch(pdfPath);
    if (!res.ok) throw new Error(`Falha ao baixar PDF para anexar (HTTP ${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(pdfPath);
}

function sanitizeForFilename(text: string): string {
  const cleaned = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "Cliente";
}

// ---------------------------------------------------------------------------
// Envio com log de entrega + retry controlado. Erros permanentes (5xx —
// endereço inválido/inexistente) não são reenviados; erros temporários (4xx,
// timeout de conexão) tentam de novo, no máximo 3 vezes, com espera crescente
// entre tentativas — nunca em loop infinito.
// ---------------------------------------------------------------------------
export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: Attachment;
  contractId?: string | null;
  tipo: string;
  clienteNome?: string;
}

async function logEmail(args: SendArgs, status: "ENVIADO" | "ERRO" | "PULADO", erro: string | null, messageId?: string) {
  try {
    await prisma.emailLog.create({
      data: {
        contractId: args.contractId || null,
        tipo: args.tipo,
        destinatario: args.to,
        clienteNome: args.clienteNome || null,
        status,
        erro,
        messageId: messageId || null,
      },
    });
  } catch (err) {
    console.error("[email] Falha ao registrar log de envio:", err);
  }
}

async function sendWithLog(args: SendArgs): Promise<SendResult> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail "${args.subject}" para ${args.to} não enviado.`);
    await logEmail(args, "PULADO", "Credenciais SMTP (GMAIL_USER/GMAIL_APP_PASSWORD) não configuradas");
    return { ok: false, error: "smtp-nao-configurado" };
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await t.sendMail({
        from: fromHeader(),
        to: args.to,
        replyTo: replyToHeader(),
        subject: args.subject,
        html: args.html,
        text: args.text,
        attachments: args.attachment ? [args.attachment] : undefined,
      });
      await logEmail(args, "ENVIADO", null, info.messageId);
      return { ok: true, messageId: info.messageId };
    } catch (err: any) {
      lastError = err;
      const code = Number(err?.responseCode) || 0;
      const permanente = code >= 500 && code < 600; // endereço inválido, rejeição definitiva etc.
      console.error(`[email] Tentativa ${attempt}/${MAX_ATTEMPTS} falhou ao enviar "${args.subject}" para ${args.to}:`, err?.message || err);
      if (permanente || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000)); // 2s, 4s
    }
  }

  const errorMessage = String(lastError?.message || lastError || "erro desconhecido");
  await logEmail(args, "ERRO", errorMessage);
  return { ok: false, error: errorMessage };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface ContratoFinalizadoEmailData {
  contractId: string;
  clienteNome: string;
  clienteEmail: string;
  tipoContrato: string;
  veiculo?: string | null;
  placa?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  pdfPath: string;
  reenvio?: boolean;
}

/** E-mail transacional principal: contrato finalizado, com o PDF anexado. */
export async function sendContratoFinalizadoEmail(data: ContratoFinalizadoEmailData): Promise<SendResult> {
  const subject = data.reenvio
    ? "Contrato FGL Contratos — Reenvio do documento finalizado"
    : "Contrato FGL Contratos — Documento finalizado";

  const rows: DetailRow[] = [
    { label: "Contrato", value: data.contractId.slice(0, 8).toUpperCase() },
    { label: "Veículo", value: data.veiculo || "" },
    { label: "Placa", value: data.placa || "" },
    { label: "Data de início", value: data.startDate ? formatDate(data.startDate) : "" },
    { label: "Validade", value: data.endDate ? formatDate(data.endDate) : "" },
  ];

  const html = layoutHtml(
    "Contrato finalizado",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(`Seu contrato com a ${BRAND} foi finalizado com sucesso.`) +
      paragraph("O documento está anexado a este e-mail.") +
      detailsTableHtml(rows) +
      paragraph("Recomendamos guardar este e-mail e o contrato em anexo em local seguro.")
  );

  const text =
    `Olá, ${data.clienteNome}.\n\n` +
    `Seu contrato com a ${BRAND} foi finalizado com sucesso.\n` +
    `O documento está anexado a este e-mail.\n\n` +
    `${detailsTableText(rows)}\n\n` +
    `Recomendamos guardar este e-mail e o contrato em anexo em local seguro.\n` +
    textFooter();

  let attachment: Attachment | undefined;
  try {
    const bytes = await fetchPdfBytes(data.pdfPath);
    attachment = {
      filename: `Contrato_FGL_Contratos_${sanitizeForFilename(data.clienteNome)}.pdf`,
      content: bytes,
      contentType: "application/pdf",
    };
  } catch (err) {
    console.error("[email] Não foi possível anexar o PDF, enviando sem anexo:", err);
  }

  return sendWithLog({
    to: data.clienteEmail,
    subject,
    html,
    text,
    attachment,
    contractId: data.contractId,
    tipo: data.reenvio ? "REENVIO" : "BOAS_VINDAS",
    clienteNome: data.clienteNome,
  });
}

export interface LembreteEmailData {
  contractId: string;
  clienteNome: string;
  clienteEmail: string;
  tipoContrato: string;
  placa?: string | null;
  endDate: Date;
  pdfUrl: string;
}

/** Lembrete amigável enviado 30 dias antes do vencimento, indicando a renovação. */
export async function sendLembrete30Email(data: LembreteEmailData): Promise<SendResult> {
  const subject = "Contrato FGL Contratos — Vencimento em 30 dias";
  const rows: DetailRow[] = [
    { label: "Contrato", value: data.contractId.slice(0, 8).toUpperCase() },
    { label: "Placa", value: data.placa || "" },
    { label: "Vencimento", value: formatDate(data.endDate) },
  ];

  const html = layoutHtml(
    "Vencimento em 30 dias",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(`Seu contrato de <strong>${data.tipoContrato}</strong> com a ${BRAND} vence em 30 dias.`) +
      detailsTableHtml(rows) +
      paragraph("Para manter seu veículo protegido sem interrupções, entre em contato para renovar antes do vencimento.") +
      textLink("Ver contrato em PDF", data.pdfUrl)
  );

  const text =
    `Olá, ${data.clienteNome}.\n\n` +
    `Seu contrato de ${data.tipoContrato} com a ${BRAND} vence em 30 dias.\n\n` +
    `${detailsTableText(rows)}\n\n` +
    `Para manter seu veículo protegido sem interrupções, entre em contato para renovar antes do vencimento.\n` +
    `Contrato em PDF: ${data.pdfUrl}\n` +
    textFooter();

  return sendWithLog({
    to: data.clienteEmail,
    subject,
    html,
    text,
    contractId: data.contractId,
    tipo: "LEMBRETE_30",
    clienteNome: data.clienteNome,
  });
}

/** Lembrete amigável enviado no dia do vencimento, indicando a renovação. */
export async function sendVencimentoEmail(data: LembreteEmailData): Promise<SendResult> {
  const subject = "Contrato FGL Contratos — Vencimento hoje";
  const rows: DetailRow[] = [
    { label: "Contrato", value: data.contractId.slice(0, 8).toUpperCase() },
    { label: "Placa", value: data.placa || "" },
    { label: "Vencimento", value: formatDate(data.endDate) },
  ];

  const html = layoutHtml(
    "Seu contrato vence hoje",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(`Seu contrato de <strong>${data.tipoContrato}</strong> com a ${BRAND} vence hoje.`) +
      detailsTableHtml(rows) +
      paragraph("Para não ficar sem proteção, entre em contato para renovar agora mesmo.") +
      textLink("Ver contrato em PDF", data.pdfUrl)
  );

  const text =
    `Olá, ${data.clienteNome}.\n\n` +
    `Seu contrato de ${data.tipoContrato} com a ${BRAND} vence hoje.\n\n` +
    `${detailsTableText(rows)}\n\n` +
    `Para não ficar sem proteção, entre em contato para renovar agora mesmo.\n` +
    `Contrato em PDF: ${data.pdfUrl}\n` +
    textFooter();

  return sendWithLog({
    to: data.clienteEmail,
    subject,
    html,
    text,
    contractId: data.contractId,
    tipo: "VENCIMENTO",
    clienteNome: data.clienteNome,
  });
}

export interface CancelamentoEmailData {
  contractId: string;
  clienteNome: string;
  clienteEmail: string;
  tipoContrato: string;
  placa?: string | null;
}

/** Enviado quando o contrato é cancelado — só texto, sem anexo. */
export async function sendCancelamentoEmail(data: CancelamentoEmailData): Promise<SendResult> {
  const subject = "Contrato FGL Contratos — Cancelamento confirmado";
  const rows: DetailRow[] = [
    { label: "Contrato", value: data.contractId.slice(0, 8).toUpperCase() },
    { label: "Placa", value: data.placa || "" },
  ];

  const html = layoutHtml(
    "Contrato cancelado",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(`Informamos que o seu contrato de <strong>${data.tipoContrato}</strong> com a ${BRAND} foi cancelado e o serviço de rastreamento não está mais ativo.`) +
      detailsTableHtml(rows) +
      paragraph("Se o cancelamento não foi solicitado por você ou tiver qualquer dúvida, entre em contato com a nossa equipe.")
  );

  const text =
    `Olá, ${data.clienteNome}.\n\n` +
    `Informamos que o seu contrato de ${data.tipoContrato} com a ${BRAND} foi cancelado e o serviço de rastreamento não está mais ativo.\n\n` +
    `${detailsTableText(rows)}\n\n` +
    `Se o cancelamento não foi solicitado por você ou tiver qualquer dúvida, entre em contato com a nossa equipe.\n` +
    textFooter();

  return sendWithLog({
    to: data.clienteEmail,
    subject,
    html,
    text,
    contractId: data.contractId,
    tipo: "CANCELAMENTO",
    clienteNome: data.clienteNome,
  });
}
