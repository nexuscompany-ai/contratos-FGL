import { put, del } from "@vercel/blob";

/**
 * Salva o PDF no Vercel Blob Storage (funciona em produção serverless,
 * ao contrário de gravar em disco local). Retorna a URL pública do arquivo,
 * que é o valor a ser guardado em Contract.pdfPath.
 *
 * Requer a env var BLOB_READ_WRITE_TOKEN, criada automaticamente ao
 * conectar um Vercel Blob Store ao projeto (Storage > Create Database > Blob).
 */
export async function savePdfToBlob(fileName: string, bytes: Uint8Array): Promise<string> {
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
