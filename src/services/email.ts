import nodemailer from "nodemailer";

const ORANGE = "#fd5f00";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#fafafa; padding:24px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e7e5e2;">
      <div style="background:${ORANGE}; padding:20px 28px;">
        <span style="color:#ffffff; font-size:17px; font-weight:bold;">FGL Contratos</span>
      </div>
      <div style="padding:28px;">
        <h1 style="font-size:18px; color:#171717; margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px; border-top:1px solid #e7e5e2; color:#737373; font-size:12px;">
        FGL Serviço de Vigilância Patrimonial e Terceirização Ltda · Este é um e-mail automático, não é necessário respondê-lo.
      </div>
    </div>
  </div>`;
}

function paragraph(text: string): string {
  return `<p style="font-size:14px; line-height:1.6; color:#333333; margin:0 0 14px;">${text}</p>`;
}

function ctaButton(label: string, url: string): string {
  return `<div style="margin:22px 0 6px;"><a href="${url}" style="display:inline-block; background:${ORANGE}; color:#ffffff; text-decoration:none; font-weight:bold; font-size:14px; padding:12px 22px; border-radius:6px;">${label}</a></div>`;
}

async function send(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail "${subject}" para ${to} não enviado.`);
    return;
  }
  try {
    await t.sendMail({
      from: `"FGL Contratos" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[email] Falha ao enviar "${subject}" para ${to}:`, err);
  }
}

export interface ContractEmailData {
  clienteNome: string;
  clienteEmail: string;
  tipoContrato: string;
  placa?: string | null;
  endDate: Date;
  pdfUrl: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

/** Enviado quando o contrato é aprovado — boas-vindas, pede pra guardar o contrato. */
export async function sendBoasVindasEmail(data: ContractEmailData) {
  const subject = "Seu contrato foi aprovado — bem-vindo(a) à FGL Contratos";
  const html = layout(
    "Contrato aprovado",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(
        `É com satisfação que confirmamos a aprovação do seu contrato de <strong>${data.tipoContrato}</strong>${
          data.placa ? ` para o veículo de placa <strong>${data.placa}</strong>` : ""
        }, com vigência até <strong>${formatDate(data.endDate)}</strong>.`
      ) +
      paragraph(
        "A partir de agora, seu veículo está sob a proteção da FGL. Recomendamos que baixe e guarde uma cópia do contrato em local seguro, pois ele contém as condições completas do serviço contratado."
      ) +
      ctaButton("Ver contrato em PDF", data.pdfUrl) +
      paragraph("Agradecemos a confiança e estamos à disposição para o que precisar.")
  );
  await send(data.clienteEmail, subject, html);
}

/** Lembrete amigável enviado 30 dias antes do vencimento, indicando a renovação. */
export async function sendLembrete30Email(data: ContractEmailData) {
  const subject = "Seu contrato vence em 30 dias — vamos renovar?";
  const html = layout(
    "Seu contrato está próximo do vencimento",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(
        `Seu contrato de <strong>${data.tipoContrato}</strong>${
          data.placa ? ` do veículo de placa <strong>${data.placa}</strong>` : ""
        } vence em <strong>${formatDate(data.endDate)}</strong> — daqui a 30 dias.`
      ) +
      paragraph(
        "Para manter seu veículo protegido sem interrupções, fale com a gente e renove seu contrato antes do vencimento."
      ) +
      ctaButton("Ver contrato em PDF", data.pdfUrl) +
      paragraph("Ficamos à disposição para renovar sua proteção.")
  );
  await send(data.clienteEmail, subject, html);
}

/** Lembrete amigável enviado no dia do vencimento, indicando a renovação. */
export async function sendVencimentoEmail(data: ContractEmailData) {
  const subject = "Seu contrato vence hoje — renove e continue protegido";
  const html = layout(
    "Seu contrato vence hoje",
    paragraph(`Olá, ${data.clienteNome}.`) +
      paragraph(
        `Seu contrato de <strong>${data.tipoContrato}</strong>${
          data.placa ? ` do veículo de placa <strong>${data.placa}</strong>` : ""
        } vence hoje, <strong>${formatDate(data.endDate)}</strong>.`
      ) +
      paragraph(
        "Para não ficar sem proteção, renove agora mesmo o seu contrato. Nossa equipe está pronta para dar continuidade ao seu atendimento."
      ) +
      ctaButton("Ver contrato em PDF", data.pdfUrl) +
      paragraph("Agradecemos por confiar na FGL e esperamos continuar protegendo seu veículo.")
  );
  await send(data.clienteEmail, subject, html);
}
