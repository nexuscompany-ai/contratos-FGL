import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import fs from "fs";
import path from "path";
import { CONTRATADA, PREAMBULO, CLAUSULAS, TEXTO_ACEITE } from "./contractTerms";

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
    endereco?: string | null;
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

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
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

  title(text: string) {
    this.newPageIfNeeded(20);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 15, font: this.bold, color: rgb(0.1, 0.1, 0.1) });
    this.y -= 22;
  }

  heading(text: string) {
    this.newPageIfNeeded(24);
    this.y -= 6;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 12, font: this.bold, color: rgb(0.1, 0.1, 0.1) });
    this.y -= 18;
  }

  label(label: string, value: string) {
    this.newPageIfNeeded(16);
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 10, font: this.bold, color: rgb(0.3, 0.3, 0.3) });
    this.page.drawText(value || "—", { x: MARGIN + 160, y: this.y, size: 10, font: this.font, color: rgb(0.1, 0.1, 0.1) });
    this.y -= 15;
  }

  paragraph(text: string, size = 9.5) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = this.font.widthOfTextAtSize(test, size);
      if (width > CONTENT_WIDTH) {
        this.newPageIfNeeded(13);
        this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font });
        this.y -= 13;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      this.newPageIfNeeded(13);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font });
      this.y -= 13;
    }
    this.y -= 5;
  }

  spacer(h = 10) {
    this.y -= h;
  }
}

export async function renderContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold);

  w.title("CONTRATO DE PROTEÇÃO VEICULAR");
  w.label("Contrato nº", data.contractId.slice(0, 8).toUpperCase());
  w.label("Tipo de contrato", data.tipoContrato);
  w.label("Valor Tabela FIPE", formatCurrency(data.valorFipe));
  w.label("Data de geração", formatDate(data.createdAt));
  w.label("Status", data.status);
  w.spacer(8);

  w.heading("CONTRATADA");
  w.label("Razão social", CONTRATADA.razaoSocial);
  w.label("CNPJ", CONTRATADA.cnpj);
  w.label("Endereço", CONTRATADA.endereco);
  w.spacer(8);

  w.heading("CONTRATANTE");
  if (data.cliente) {
    w.label("Nome completo", data.cliente.nomeCompleto);
    if (data.cliente.cpf) w.label("CPF", data.cliente.cpf);
    if (data.cliente.dataNascimento) w.label("Data de nascimento", data.cliente.dataNascimento);
    w.label("Endereço", data.cliente.endereco || "");
    w.label("Telefone", data.cliente.telefone || "");
    w.label("E-mail", data.cliente.email || "");
  } else {
    w.paragraph("A ser preenchido pelo CONTRATANTE.");
  }
  w.spacer(8);

  w.heading("VEÍCULO");
  if (data.veiculo) {
    w.label("Placa", data.veiculo.placa);
    w.label("Modelo e ano", `${data.veiculo.marca || ""} ${data.veiculo.modelo || ""} ${data.veiculo.ano || ""}`.trim());
    if (data.veiculo.renavam) w.label("Renavam", data.veiculo.renavam);
    if (data.veiculo.chassi) w.label("Chassi", data.veiculo.chassi);
  } else {
    w.paragraph("A ser preenchido pelo CONTRATANTE.");
  }
  w.spacer(10);

  w.paragraph(PREAMBULO, 9.5);
  w.spacer(6);

  for (const clausula of CLAUSULAS) {
    w.heading(clausula.titulo);
    for (const p of clausula.paragrafos) {
      w.paragraph(p);
    }
  }

  w.spacer(10);
  w.heading("TERMOS E CONDIÇÕES");
  if (data.aceite) {
    w.paragraph(`[X] ${TEXTO_ACEITE}`);
    w.spacer(4);
    w.label("Aceito em", data.aceite.acceptedAt.toLocaleString("pt-BR"));
    w.label("IP de origem", data.aceite.ip || "—");
    w.paragraph(
      "O aceite acima constitui assinatura eletrônica válida entre as partes, nos termos da legislação aplicável."
    );
  } else {
    w.paragraph(`[ ] ${TEXTO_ACEITE}`);
    w.paragraph("Aguardando aceite do CONTRATANTE.");
  }

  if (data.vigencia) {
    w.spacer(6);
    w.heading("VIGÊNCIA");
    w.label("Início", formatDate(data.vigencia.startDate));
    w.label("Término", formatDate(data.vigencia.endDate));
  }

  return doc.save();
}

export function pdfStoragePath(fileName: string): string {
  return path.join(process.cwd(), "storage", "pdfs", fileName);
}

export function savePdfToDisk(fileName: string, bytes: Uint8Array): string {
  const filePath = pdfStoragePath(fileName);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}
