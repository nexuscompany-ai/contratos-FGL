import { put, del } from "@vercel/blob";
import { savePdfToDisk } from "./pdf";

/**
 * Salva o PDF no Vercel Blob Storage (funciona em produção serverless,
 * ao contrário de gravar em disco local). Retorna a URL pública do arquivo,
 * que é o valor a ser guardado em Contract.pdfPath.
 *
 * Requer a env var BLOB_READ_WRITE_TOKEN, criada automaticamente ao
 * conectar um Vercel Blob Store ao projeto (Storage > Create Database > Blob).
 * Sem essa env var (modo demo, sem Blob configurado), cai para disco local
 * (em /tmp na Vercel) — os PDFs não persistem entre deploys nesse caso.
 */
export async function savePdfToBlob(fileName: string, bytes: Uint8Array): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return savePdfToDisk(fileName, bytes);
  }

  const blob = await put(`pdfs/${fileName}`, Buffer.from(bytes), {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deletePdfFromBlob(url: string): Promise<void> {
  await del(url);
}
