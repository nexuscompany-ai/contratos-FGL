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

Node.js + TypeScript + Express + Prisma (PostgreSQL) + EJS + pdf-lib (geração do PDF do contrato com o texto oficial do Contrato de Proteção Veicular) + Vercel Blob (armazenamento dos PDFs gerados).

## Rodando localmente

Requer um banco PostgreSQL (local, Vercel Postgres, Neon, Supabase etc.) e um Blob Store da Vercel.

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e BLOB_READ_WRITE_TOKEN
npx prisma migrate dev
npm run seed            # cria o usuário admin (ADMIN_EMAIL / ADMIN_PASSWORD do .env)
npm run dev
```

Acesse `http://localhost:3000`, faça login com o admin criado pelo seed.

## Deploy na Vercel

1. No dashboard do projeto: **Storage → Create Database → Postgres** (cria `DATABASE_URL` automaticamente) e **Storage → Create Database → Blob** (cria `BLOB_READ_WRITE_TOKEN` automaticamente).
2. Configure as demais env vars do `.env.example` (`SESSION_SECRET`, `BASE_URL`, `ADMIN_*`) em Project Settings → Environment Variables.
3. Rode `npx prisma migrate deploy` apontando para o `DATABASE_URL` de produção (localmente ou via um passo de build) para aplicar as migrations, depois `npm run seed` uma vez para criar o admin.
4. Push na branch conectada dispara o deploy — o `vercel.json` já expõe o Express como função serverless em `api/index.ts`.

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
