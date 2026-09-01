import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from "pdf-lib";
import fs from "fs";
import path from "path";
import { CONTRATADA, PREAMBULO, clausulasComValorFipe, TEXTO_ACEITE } from "./contractTerms";
import { formatCpf } from "../utils/format";

export interface ContractPdfData {
  contractId: string;
  token: string;
  tipoContrato: string;
  valorFipe: number;
  status: string;
  createdAt: Date;
  cliente?: {
    nomeCompleto: string;
    cpf?: string | null;
    dataNascimento?: string | null;
    telefone?: string | null;
    email?: string | null;
  } | null;
  veiculo?: {
    placa: string;
    renavam?: string | null;
    chassi?: string | null;
    modelo?: string | null;
    marca?: string | null;
    ano?: string | null;
  } | null;
  aceite?: {
    acceptedAt: Date;
    ip?: string | null;
  } | null;
  vigencia?: {
    startDate: Date;
    endDate: Date;
  } | null;
}

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_HEIGHT = 78;
const FOOTER_HEIGHT = 34;

const COLOR_ORANGE = rgb(0.992, 0.373, 0); // #fd5f00 — laranja FGL
const COLOR_ORANGE_TINT = rgb(1, 0.925, 0.878); // #ffece0
const COLOR_TEXT = rgb(0.09, 0.09, 0.09); // preto
const COLOR_MUTED = rgb(0.45, 0.45, 0.45);
const COLOR_CARD_BG = rgb(0.98, 0.98, 0.976);
const COLOR_CARD_BORDER = rgb(0.906, 0.898, 0.886);
const COLOR_HEADING = COLOR_ORANGE;
const COLOR_GREEN = rgb(0.086, 0.396, 0.204); // #166534 — mesmo verde do badge ATIVO no site
const COLOR_GREEN_TINT = rgb(0.941, 0.969, 0.949); // #f0f7f2

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function loadLogoBytes(): Buffer | null {
  const candidates = ["logo.png", "logo.jpg", "logo.jpeg"];
  for (const name of candidates) {
    const p = path.join(process.cwd(), "src", "public", name);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

class Writer {
  private page: PDFPage;
  private y: number;

  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private newPageIfNeeded(nextLineHeight: number) {
    if (this.y - nextLineHeight < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  currentPage() {
    return this.page;
  }

  setY(y: number) {
    this.y = y;
  }

  title(text: string) {
    this.newPageIfNeeded(20);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 15, font: this.bold, color: COLOR_TEXT });
    this.y -= 22;
  }

  heading(text: string) {
    this.newPageIfNeeded(24);
    this.y -= 6;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 12, font: this.bold, color: COLOR_HEADING });
    this.y -= 18;
  }

  label(label: string, value: string) {
    this.newPageIfNeeded(16);
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 10, font: this.bold, color: rgb(0.3, 0.3, 0.3) });
    const fitted = this.fitText(this.font, value || "—", CONTENT_WIDTH - 160, 10);
    this.page.drawText(fitted.text, { x: MARGIN + 160, y: this.y, size: fitted.size, font: this.font, color: COLOR_TEXT });
    this.y -= 15;
  }

  /**
   * Bloco de aceite dos termos: um selo colorido ("ACEITE CONFIRMADO" em
   * verde ou "AGUARDANDO ACEITE" em cinza) em vez do texto "[X]"/"[ ]"
   * solto, seguido do texto do aceite e, quando já aceito, dos metadados
   * (data/IP) da assinatura eletrônica.
   */
  acceptanceBlock(text: string, accepted: boolean, meta?: { acceptedAt: string; ip: string }) {
    this.newPageIfNeeded(30);

    const badgeText = accepted ? "ACEITE CONFIRMADO" : "AGUARDANDO ACEITE";
    const badgeColor = accepted ? COLOR_GREEN : COLOR_MUTED;
    const badgeBg = accepted ? COLOR_GREEN_TINT : COLOR_CARD_BG;
    const badgeSize = 8.5;
    const badgePadX = 9;
    const badgeHeight = 17;
    const badgeWidth = this.bold.widthOfTextAtSize(badgeText, badgeSize) + badgePadX * 2;

    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - badgeHeight + 5,
      width: badgeWidth,
      height: badgeHeight,
      color: badgeBg,
    });
    this.page.drawText(badgeText, {
      x: MARGIN + badgePadX,
      y: this.y - badgeHeight + 5 + 5,
      size: badgeSize,
      font: this.bold,
      color: badgeColor,
    });
    this.y -= badgeHeight + 12;

    this.paragraph(text);

    if (meta) {
      this.spacer(2);
      this.label("Aceito em", meta.acceptedAt);
      this.label("IP de origem", meta.ip);
    }
  }

  paragraph(text: string, size = 9.5) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = this.font.widthOfTextAtSize(test, size);
      if (width > CONTENT_WIDTH) {
        this.newPageIfNeeded(13);
        this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: COLOR_TEXT });
        this.y -= 13;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      this.newPageIfNeeded(13);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: COLOR_TEXT });
      this.y -= 13;
    }
    this.y -= 5;
  }

  spacer(h = 10) {
    this.y -= h;
  }

  /**
   * Encolhe o tamanho da fonte até o texto caber em maxWidth (até um
   * mínimo) e, se ainda assim não couber, corta com reticências. Sem
   * isso, valores longos (nome completo, e-mail, modelo+marca+ano do
   * veículo concatenados) escapavam da largura da coluna e apareciam
   * "vazando" pra fora da caixa do card no PDF.
   */
  private fitText(font: PDFFont, text: string, maxWidth: number, startSize: number, minSize = 7): { text: string; size: number } {
    let size = startSize;
    while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
      size -= 0.5;
    }
    if (font.widthOfTextAtSize(text, size) > maxWidth) {
      let truncated = text;
      while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      text = `${truncated}…`;
    }
    return { text, size };
  }

  /**
   * Bloco de informações em card: título em laranja acima de uma caixa com
   * fundo claro e uma faixa de destaque na lateral esquerda, campos
   * organizados em duas colunas (rótulo pequeno em cima, valor em baixo)
   * em vez da lista solta de "rótulo: valor".
   */
  infoCard(title: string, fields: Array<{ label: string; value: string }>) {
    const rows = Math.ceil(fields.length / 2);
    const rowHeight = 32;
    const boxHeight = rows * rowHeight + 20;

    this.newPageIfNeeded(boxHeight + 24);
    this.y -= 4;
    this.page.drawText(title, { x: MARGIN, y: this.y, size: 11, font: this.bold, color: COLOR_HEADING });
    this.y -= 16;

    const boxTop = this.y;
    const boxBottom = boxTop - boxHeight;
    this.page.drawRectangle({
      x: MARGIN,
      y: boxBottom,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: COLOR_CARD_BG,
      borderColor: COLOR_CARD_BORDER,
      borderWidth: 1,
    });
    this.page.drawRectangle({
      x: MARGIN,
      y: boxBottom,
      width: 3,
      height: boxHeight,
      color: COLOR_ORANGE,
    });

    const colWidth = CONTENT_WIDTH / 2;
    const padX = 16;
    const padY = 14;
    const valueMaxWidth = colWidth - padX - 10;
    let fieldY = boxTop - padY - 9;

    fields.forEach((field, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MARGIN + padX + col * colWidth;
      const rowY = fieldY - row * rowHeight;
      this.page.drawText(field.label.toUpperCase(), {
        x,
        y: rowY,
        size: 7.5,
        font: this.bold,
        color: COLOR_MUTED,
      });
      const fitted = this.fitText(this.font, field.value || "—", valueMaxWidth, 10.5);
      this.page.drawText(fitted.text, {
        x,
        y: rowY - 13,
        size: fitted.size,
        font: this.font,
        color: COLOR_TEXT,
      });
    });

    this.y = boxBottom - 14;
  }
}

function drawHeader(page: PDFPage, bold: PDFFont, font: PDFFont, logo: PDFImage | null, contractId: string) {
  // Cabeçalho branco, com a logo e o nome da marca — a faixa laranja embaixo
  // é grossa o bastante pra funcionar como elemento de identidade visual,
  // não só um traço decorativo, e o número do contrato ganha um "chip"
  // laranja em vez de texto cinza discreto.
  let textX = MARGIN;

  if (logo) {
    const logoHeight = 48;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - HEADER_HEIGHT / 2 - logoHeight / 2,
      width: logoWidth,
      height: logoHeight,
    });
    textX = MARGIN + logoWidth + 14;
  }

  page.drawText("FGL Contratos", { x: textX, y: PAGE_HEIGHT - 34, size: 15, font: bold, color: COLOR_TEXT });
  page.drawText("Contrato de Proteção Veicular", {
    x: textX,
    y: PAGE_HEIGHT - 50,
    size: 9.5,
    font,
    color: COLOR_MUTED,
  });

  const numero = `Nº ${contractId.slice(0, 8).toUpperCase()}`;
  const numeroSize = 9;
  const numeroWidth = bold.widthOfTextAtSize(numero, numeroSize);
  const chipPadX = 10;
  const chipHeight = 20;
  const chipWidth = numeroWidth + chipPadX * 2;
  const chipX = PAGE_WIDTH - MARGIN - chipWidth;
  const chipY = PAGE_HEIGHT - 40;
  page.drawRectangle({
    x: chipX,
    y: chipY,
    width: chipWidth,
    height: chipHeight,
    color: COLOR_ORANGE_TINT,
  });
  page.drawText(numero, {
    x: chipX + chipPadX,
    y: chipY + 6,
    size: numeroSize,
    font: bold,
    color: COLOR_ORANGE,
  });

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: 5,
    color: COLOR_ORANGE,
  });
}

function drawFooter(page: PDFPage, font: PDFFont, pageIndex: number, pageCount: number) {
  page.drawRectangle({
    x: 0,
    y: FOOTER_HEIGHT - 3,
    width: PAGE_WIDTH,
    height: 1,
    color: COLOR_CARD_BORDER,
  });

  page.drawText("FGL Contratos · Rastreamento Veicular", {
    x: MARGIN,
    y: 16,
    size: 8,
    font,
    color: COLOR_MUTED,
  });

  const label = `Página ${pageIndex} de ${pageCount}`;
  const labelWidth = font.widthOfTextAtSize(label, 8);
  page.drawText(label, {
    x: PAGE_WIDTH - MARGIN - labelWidth,
    y: 16,
    size: 8,
    font,
    color: COLOR_MUTED,
  });
}

export async function renderContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = loadLogoBytes();
  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      logo = await doc.embedPng(logoBytes);
    } catch {
      try {
        logo = await doc.embedJpg(logoBytes);
      } catch {
        logo = null;
      }
    }
  }

  const w = new Writer(doc, font, bold);
  drawHeader(w.currentPage(), bold, font, logo, data.contractId);
  w.setY(PAGE_HEIGHT - HEADER_HEIGHT - 26);

  w.label("Tipo de contrato", data.tipoContrato);
  w.label("Valor Tabela FIPE", formatCurrency(data.valorFipe));
  w.label("Data de geração", formatDate(data.createdAt));
  w.label("Status", data.status);
  w.spacer(10);

  w.infoCard("CONTRATADA", [
    { label: "Razão social", value: CONTRATADA.razaoSocial },
    { label: "CNPJ", value: CONTRATADA.cnpj },
    { label: "Endereço", value: CONTRATADA.endereco },
  ]);

  if (data.cliente) {
    w.infoCard("CONTRATANTE", [
      { label: "Nome completo", value: data.cliente.nomeCompleto },
      { label: "CPF", value: formatCpf(data.cliente.cpf) },
      { label: "Data de nascimento", value: data.cliente.dataNascimento || "" },
      { label: "Telefone", value: data.cliente.telefone || "" },
      { label: "E-mail", value: data.cliente.email || "" },
    ]);
  } else {
    w.heading("CONTRATANTE");
    w.paragraph("A ser preenchido pelo CONTRATANTE.");
    w.spacer(4);
  }

  if (data.veiculo) {
    w.infoCard("VEÍCULO", [
      { label: "Placa", value: data.veiculo.placa },
      { label: "Modelo e ano", value: `${data.veiculo.marca || ""} ${data.veiculo.modelo || ""} ${data.veiculo.ano || ""}`.trim() },
      { label: "Renavam", value: data.veiculo.renavam || "" },
      { label: "Chassi", value: data.veiculo.chassi || "" },
    ]);
  } else {
    w.heading("VEÍCULO");
    w.paragraph("A ser preenchido pelo CONTRATANTE.");
    w.spacer(4);
  }

  w.paragraph(PREAMBULO, 9.5);
  w.spacer(6);

  for (const clausula of clausulasComValorFipe(data.valorFipe)) {
    w.heading(clausula.titulo);
    for (const p of clausula.paragrafos) {
      w.paragraph(p);
    }
  }

  w.spacer(10);
  w.heading("TERMOS E CONDIÇÕES");
  if (data.aceite) {
    w.acceptanceBlock(TEXTO_ACEITE, true, {
      acceptedAt: data.aceite.acceptedAt.toLocaleString("pt-BR"),
      ip: data.aceite.ip || "—",
    });
    w.paragraph(
      "O aceite acima constitui assinatura eletrônica válida entre as partes, nos termos da legislação aplicável."
    );
  } else {
    w.acceptanceBlock(TEXTO_ACEITE, false);
    w.paragraph("Aguardando aceite do CONTRATANTE.");
  }

  if (data.vigencia) {
    w.spacer(6);
    w.heading("VIGÊNCIA");
    w.label("Início", formatDate(data.vigencia.startDate));
    w.label("Término", formatDate(data.vigencia.endDate));
  }

  const pages = doc.getPages();
  pages.forEach((page, i) => drawFooter(page, font, i + 1, pages.length));

  return doc.save();
}

export function pdfStoragePath(fileName: string): string {
  const baseDir = process.env.VERCEL
    ? path.join("/tmp", "storage", "pdfs")
    : path.join(process.cwd(), "storage", "pdfs");
  return path.join(baseDir, fileName);
}

/**
 * Salva o PDF em disco local (em /tmp na Vercel, sem persistência entre
 * deploys/cold starts). Usado como fallback quando não há Blob Storage
 * configurado — veja savePdfToBlob (src/services/blob.ts).
 */
export function savePdfToDisk(fileName: string, bytes: Uint8Array): string {
  const filePath = pdfStoragePath(fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

/**
 * pdfPath tanto pode ser uma URL pública (Vercel Blob) quanto um caminho de
 * arquivo local (fallback em disco) — decide entre redirect e sendFile.
 */
export function sendPdfResponse(res: import("express").Response, pdfPath: string) {
  if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
    res.redirect(pdfPath);
  } else {
    res.sendFile(pdfPath);
  }
}
