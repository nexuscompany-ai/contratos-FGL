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

Node.js + TypeScript + Express + Prisma (PostgreSQL em produção, SQLite em dev local) + EJS + pdf-lib (geração do PDF do contrato com o texto oficial do Contrato de Proteção Veicular).

## Produção (Vercel)

O projeto está conectado a um banco Postgres real (Neon, via Vercel Storage)
e a um Vercel Blob Store — as env vars `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`
já são injetadas automaticamente pela Vercel em cada deploy. Os dados
(contratos, clientes, PDFs) persistem de verdade entre deploys e cold starts.

Se o projeto for clonado para uma nova conta/ambiente Vercel do zero:

1. **Storage → Create Database → Postgres** (cria `DATABASE_URL` automaticamente) e **Storage → Create Database → Blob** (cria `BLOB_READ_WRITE_TOKEN` automaticamente).
2. Configure `SESSION_SECRET`, `BASE_URL`, `ADMIN_*` em Project Settings → Environment Variables.
3. Aplique as migrations existentes em `prisma/migrations` contra o novo banco (`npx prisma migrate deploy`).
4. Push na branch conectada dispara o deploy — o `vercel.json` já expõe o Express como função serverless em `api/index.ts`.

## Desenvolvimento local

Sem `DATABASE_URL` definida, o app usa um SQLite local (`./dev.db`) só para
rodar na sua máquina — isso não tem relação com o banco de produção.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e entre com `admin@fgl.com.br` / `admin123`
(ou os valores de `ADMIN_EMAIL`/`ADMIN_PASSWORD`, se definidos).

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
