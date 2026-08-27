# FGL Contratos

MVP do sistema de geração, envio e aprovação de contratos da FGL. Fluxo:

```
FGL gera contrato (valor FIPE + tipo)
  → link único para o cliente
  → cliente preenche dados + aceita os termos
  → contrato fica PENDENTE
  → FGL aprova
  → PDF final gerado, vigência de 1 ano iniciada
  → contrato ATIVO
  → 30 dias antes do vencimento → PRESTES A VENCER
  → data de vencimento → VENCIDO
```

## Stack

Node.js + TypeScript + Express + Prisma (SQLite) + EJS + pdf-lib (geração do PDF do contrato com o texto oficial do Contrato de Proteção Veicular).

## Rodando localmente

```bash
npm install
cp .env.example .env   # ajuste os valores se quiser
npx prisma migrate dev
npm run seed            # cria o usuário admin (ADMIN_EMAIL / ADMIN_PASSWORD do .env)
npm run dev
```

Acesse `http://localhost:3000`, faça login com o admin criado pelo seed.

## Estrutura

- `src/routes/admin.ts` — dashboard, enviar contrato, aprovação, listagens, clientes (área logada da FGL)
- `src/routes/public.ts` — página pública `/contrato/:token` onde o cliente preenche e aceita
- `src/routes/auth.ts` — login/logout
- `src/services/pdf.ts` — geração do PDF do contrato
- `src/services/contractTerms.ts` — texto oficial das cláusulas do Contrato de Proteção Veicular
- `src/services/contractLifecycle.ts` — regras de vigência (1 ano), alerta de 30 dias e transição automática para vencido
- `prisma/schema.prisma` — modelo de dados (usuários, clientes, veículos, contratos, aceites)

## Pendências conhecidas (fora do escopo do MVP)

- Envio de e-mail automático ao cliente (hoje só loga no console; falta configurar SMTP)
- Autenticação com múltiplos perfis/permissões (hoje só admin/funcionário no schema, sem UI de gestão de usuários)
- Renomear o valor de FIPE do veículo automaticamente por integração com tabela FIPE (hoje é digitado manualmente)
