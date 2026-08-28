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

## Modo demo (padrão, zero configuração)

Sem nenhuma env var configurada, o app roda sozinho: cria um banco SQLite
automaticamente na primeira requisição, cria um usuário admin padrão
(`admin@fgl.com.br` / `admin123`, ou os valores de `ADMIN_EMAIL`/`ADMIN_PASSWORD`
se você definir) e salva os PDFs em disco. Não precisa de Postgres nem de
Vercel Blob — é só pra navegar pela plataforma, ver o design e o fluxo.

**Isso não persiste de verdade:** na Vercel o SQLite fica em `/tmp`, que é
apagado a cada cold start/novo deploy. Dados de teste (contratos, clientes)
não sobrevivem entre sessões. Quando for pra produção real, siga a seção
"Deploy em produção (com persistência)" abaixo.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e entre com `admin@fgl.com.br` / `admin123`.

## Deploy em produção (com persistência)

Quando quiser que os dados fiquem salvos de verdade:

1. Troque `provider = "sqlite"` por `provider = "postgresql"` em `prisma/schema.prisma`.
2. No dashboard da Vercel: **Storage → Create Database → Postgres** (cria `DATABASE_URL` automaticamente) e **Storage → Create Database → Blob** (cria `BLOB_READ_WRITE_TOKEN` automaticamente) — com essas env vars presentes o app já usa Postgres/Blob em vez do modo demo.
3. Configure `SESSION_SECRET`, `BASE_URL`, `ADMIN_*` em Project Settings → Environment Variables.
4. Rode `npx prisma migrate dev` localmente (com o `DATABASE_URL` de produção) para gerar a migration do Postgres, depois `npx prisma migrate deploy` para aplicá-la, e `npm run seed` uma vez para criar o admin.
5. Push na branch conectada dispara o deploy — o `vercel.json` já expõe o Express como função serverless em `api/index.ts`.

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
