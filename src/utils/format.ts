/** Formata CPF (11 dígitos) como "###.###.###-##". Retorna o valor original se não tiver 11 dígitos. */
export function formatCpf(cpf?: string | null): string {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return cpf || "";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Valida CPF pelos dígitos verificadores oficiais (não checa se existe de fato, só o formato/algoritmo). */
export function isValidCpf(cpf: string): boolean {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // 111.111.111-11 etc.

  const checkDigit = (base: string): number => {
    let sum = 0;
    let weight = base.length + 1;
    for (const ch of base) {
      sum += Number(ch) * weight;
      weight--;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const base = digits.slice(0, 9);
  const d1 = checkDigit(base);
  const d2 = checkDigit(base + d1);
  return digits === `${base}${d1}${d2}`;
}
