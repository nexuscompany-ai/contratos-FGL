# FGL Contratos — contexto do projeto

Sistema de geração, envio, aceite e aprovação de contratos de rastreamento
veicular da FGL. Node.js + TypeScript + Express + Prisma + EJS + pdf-lib,
deploy na Vercel como função serverless (`api/index.ts`).

Branch de trabalho: **`claude/rode-o-mazyos-3fo9uj`** (todo o histórico
relevante está nela, não na `main`).

## Estado atual (a saber antes de mexer em qualquer coisa)

- **Fluxo de negócio**: FGL gera contrato (plano "Proteção Veicular" exige
  valor FIPE; "Plano Básico" não) → link único → cliente preenche dados +
  aceita os termos → PENDENTE → FGL aprova → PDF final, vigência de 1 ano →
  ATIVO → 30 dias antes do vencimento → PRESTES A VENCER → VENCIDO
  automaticamente. Ver `src/routes/admin.ts`, `src/routes/public.ts`,
  `src/services/contractLifecycle.ts`.
- **Banco**: Prisma com `provider = "postgresql"` (produção real, via Neon
  conectado no Vercel Storage). Localmente, sem `DATABASE_URL` definida,
  cai num SQLite (`./dev.db`) só pra rodar na máquina — não afeta produção
  (ver `src/db.ts`). Havia um modo "demo" com SQLite autoprovisionado
  (`src/db-bootstrap.ts`) usado quando o projeto ainda não tinha Postgres
  conectado; hoje é código morto em produção (só dispara se `DATABASE_URL`
  começar com `file:`), pode ser removido quando não fizer mais falta.
- **PDFs**: gerados com pdf-lib (`src/services/pdf.ts`), texto oficial do
  contrato em `src/services/contractTerms.ts` (cláusula 6.1 tem o teto da
  multa dinâmico, calculado a partir do valor FIPE do contrato — não é
  mais fixo em R$18.000). Salvos no Vercel Blob se `BLOB_READ_WRITE_TOKEN`
  existir, senão caem para disco local (`src/services/blob.ts`).
- **Identidade visual**: redesign completo feito (commit `0cdbd33`) —
  laranja `#fd5f00` (ajustado a pedido do dono, mais forte/quente que o
  `#eb692d` original — passou por `#fd6100` antes de fechar neste tom) +
  branco + preto, fonte Inter, marca "FGL Contratos" em toda a plataforma
  e no PDF (renomeada de "FGL Rastreamento" a pedido do dono). Logo atual
  em `src/public/logo.jpg` é um placeholder (águia laranja) — o dono do
  projeto disse que ia mandar a logo oficial mas nunca chegou; trocar o
  arquivo (e favicon.png/apple-touch-icon.png, regenerados a partir dela)
  assim que ele mandar.
- **Sessão de login**: usa `cookie-session` (não `express-session`) —
  guarda a sessão inteira, assinada, no cookie do navegador em vez de
  memória do servidor. Isso é obrigatório na Vercel: funções serverless
  sobem instâncias novas o tempo todo, e um `MemoryStore` em RAM perde a
  sessão a cada cold start, forçando login repetido e fazendo qualquer
  link protegido parecer "quebrado" (na real cai no /login). `maxAge` de
  30 dias. Ver `src/server.ts`.
- **Regra de UX fixa**: todo botão "← Voltar" fica no TOPO da página,
  nunca no rodapé (`.back-link` no `style.css`).
- **Endereço do cliente**: removido de propósito do formulário/PDF/telas
  (decisão explícita do dono do produto — "não precisa colocar o
  endereço"). Não reintroduzir sem confirmar com ele, mesmo que outro
  brief peça o contrário.

## Infra na Vercel — cuidado, tem pegadinha

- Time correto: **`Nexus Solutions' projects`** (`team_qbvXBpKrBw5UKYX41z6LH7NS`).
  Só aparece na integração MCP depois que o usuário concede acesso — se
  `list_teams` só mostrar "FELIPE ALMEIDA's projects", pedir pra ele
  liberar de novo, o acesso já caiu uma vez.
- Projeto correto: **`contratos-fgl`** (`prj_SdHQBZiQxBwu9ucCZNdNQpBOLliH`),
  domínio de produção `contratos-fgl.vercel.app`.
- **Existe um segundo projeto solto**, `assine.contratos-fgl`
  (`prj_elz8tDdOrJLh9d1EgJXi9zUPIR9W`), ligado ao mesmo repo, cuja
  produção nunca teve um deploy bem-sucedido (o primeiro deploy de
  produção falhou e nunca foi promovido de novo). Provavelmente lixo de
  configuração duplicada — confirmar com o usuário se pode desativar,
  não confundir com o projeto de verdade.
- **Sem ferramenta de "promote to production"** disponível nesta
  integração MCP da Vercel (nem de editar env vars) — só leitura
  (`get_project`, `list_deployments`, `get_deployment`, `get_runtime_logs`,
  `get_runtime_errors`). Promoção manual e env vars são só pelo dashboard,
  o usuário precisa fazer.
- Vários pushes diretos apareceram no branch vindos de "nexuscompany-ai"
  (dono da conta) e de outras sessões do Claude — sempre dar `git fetch` +
  checar `git log` antes de push, e ler o diff de commits alheios antes
  de mesclar (uma vez veio um commit desativando a autenticação inteira
  "temporariamente" — foi revertido).
- `vercel.json` → `buildCommand` roda `prisma generate && prisma migrate
  deploy && (npm run seed || true)` — aplica migrations pendentes e
  garante o admin automaticamente a cada deploy, sem precisar de acesso
  manual ao Postgres. Login padrão: `admin@fgl.com.br` / `admin123` (ou
  os valores de `ADMIN_EMAIL`/`ADMIN_PASSWORD` se configurados na Vercel).

## Coisas que já apareceram como pedido e por quê foram resolvidas assim

- "Site voltou pro design antigo" → normalmente é cache do navegador ou o
  usuário olhando o projeto errado (`assine.contratos-fgl`), não código
  desatualizado — checar `get_deployment` do alias de produção antes de
  supor que quebrou algo.
- "Erro: table X does not exist" → falta rodar `prisma migrate deploy`
  contra o Postgres de produção; o `buildCommand` acima já resolve isso
  de forma permanente a partir de agora.
