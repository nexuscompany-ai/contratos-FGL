/** Formata CPF (11 dígitos) como "###.###.###-##". Retorna o valor original se não tiver 11 dígitos. */
export function formatCpf(cpf?: string | null): string {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return cpf || "";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}
