# ORION — Plataforma de Gestão Executiva

> **REGRA DE DEPLOY — LER ANTES DE QUALQUER COMMIT:**
> Todo push DEVE ir para origin (`maxwellmachadoadm-ui/ORION`).
> **NUNCA** fazer push apenas para MAXXXI esperando chegar ao Vercel.
> Após cada commit, executar:
> ```
> git remote -v        # confirmar que origin = ORION
> git push origin main
> ```
> Se o remote não for ORION, **parar e avisar Maxwell imediatamente**.

## Arquitetura

- **Tipo**: Single-file static HTML app (`index.html`)
- **Deploy**: Vercel (static build via `@vercel/static`)
- **Framework**: Vanilla JS, CSS-in-file, no build tools
- **Fontes**: DM Sans (body), Syne (headings/valores)
- **Persistência**: Supabase (primário) + localStorage (cache/fallback)
- **IA**: Anthropic API (claude-sonnet-4-20250514) com fallback local
- **Supabase**: CDN @supabase/supabase-js@2, credenciais em localStorage

> **IMPORTANTE**: NÃO existe src/, NÃO existe React, NÃO existe npm.
> Todo o código está em `index.html` (3172 linhas, ~169KB).
> NÃO usar `npm run build` — o deploy é estático direto.

## Estrutura de Arquivos

```
/
├── index.html              # App inteiro (HTML + CSS + JS)
├── vercel.json             # Config deploy Vercel (static + SPA routing)
├── .env                    # VITE_ANTHROPIC_KEY (não utilizado no runtime)
├── README.md               # Descrição básica
├── CLAUDE.md               # Este arquivo
├── public/
│   ├── manifest.json       # PWA manifest
│   └── orion-logo.svg      # Logo constelação Orion (favicon + PWA)
└── supabase/
    ├── v15.sql             # Schema: lancamentos, tarefas, leads, invites, empresa_modulos
    ├── v16_company_id.sql  # Migration: empresa_id + índices
    ├── v17_financeiro.sql  # Migration: categorias, contas, DRE views
    ├── v19_full_schema.sql # Schema completo: todas tabelas + seeds
    └── create_buckets.sql  # Storage: avatars, logos, biblioteca
```

## Remote e Deploy

- **GitHub (produção)**: `maxwellmachadoadm-ui/ORION` — este é o repo que o Vercel monitora
- **GitHub (dev)**: `maxwellmachadoadm-ui/MAXXXI` — repo separado, NÃO vai ao Vercel
- **Vercel**: conectado ao repo **ORION**, deploy automático em push para `main`
- **URL produção**: https://orion-platform-wine.vercel.app
- **Branch de desenvolvimento**: `claude/autonomous-mode-setup-WMj8y` (no repo MAXXXI)

> **NUNCA** fazer push para MAXXXI esperando que chegue ao Vercel.
> Para deployar: push para `main` do repo **ORION**.

## Empresas (5 ativas)

| ID   | Nome               | Sigla | Tipo      | Fat    | Result | Score |
|------|--------------------|-------|-----------|--------|--------|-------|
| dw   | Doctor Wealth      | DW    | Portfólio | 48.500 | 22.000 | 80    |
| of   | Original Fotografia| OF    | Portfólio | 28.000 | 4.200  | 52    |
| fs   | Forme Seguro       | FS    | Portfólio | 15.000 | 8.500  | 65    |
| cdl  | CDL Divinópolis    | CDL   | Portfólio | 35.000 | 12.000 | 88    |
| gp   | Gestão Pessoal     | GP    | Pessoal   | 0      | 0      | 75    |

## Estado Global

- `curEmp` — empresa ativa (null = home)
- `curTab` — aba ativa no workspace
- `mxOpen` — estado do drawer MAXXXI
- `mxHistory` — histórico de chat
- Persistência: `localStorage` com prefixo `orion_`
  - `orion_session` — sessão do usuário
  - `orion_users` — lista de usuários
  - `orion_empresa_ativa` — empresa ativa persistida
  - `orion_tasks_{id}` — tarefas por empresa
  - `orion_crm_{id}` — CRM por empresa
  - `orion_notas_{id}` — notas por empresa
  - `orion_lanc_{id}` — lançamentos financeiros por empresa
  - `orion_modulos_{id}` — módulos ativos por empresa
  - `orion_agenda` — agenda global
  - `orion_alerts` — alertas
  - `orion_ci_{date}` — check-in diário
  - `orion_invites` — convites de usuário
  - `orion_sb_url` — URL Supabase
  - `orion_sb_key` — Anon key Supabase
  - `orion_api_key` — API key Anthropic (MAXXXI)
  - `orion_mx_briefing` — data do último briefing MAXXXI

## Features Implementadas (v16)

### Multiempresa (v16)
- Isolamento completo por company_id em todas as entidades
- Troca de empresa atualiza toda a UI
- empresaAtiva persiste em localStorage entre sessões
- Home dividida em PORTFÓLIO (DW, OF, FS, CDL) e PESSOAL (GP)

### Engine Financeira (v17)
- FMT utilities NaN-safe: `brl`, `brlK`, `pct`, `pctVal`, `score`, `num`
- Lançamentos CRUD com type (income/expense/transfer/investment)
- `impacta_resultado`: transfer e investment NÃO afetam resultado operacional
- 23 categorias pré-definidas (saúde, alimentação, moradia, transporte, etc.)
- DRE estruturada: receita → impostos → despesas por categoria → resultado → margem
- Fluxo de caixa: 8 meses com entradas, saídas, saldo, acumulado
- Formulário de lançamento completo com validações inline
- Fallback demoData (`temLancamentos`) quando sem lançamentos reais

### Visão CEO (v18)
- 8 seções executivas READ ONLY
- S1: Header com seletor período (mês/trimestre/ano)
- S2: 5 KPIs consolidados (receita, despesa, resultado, health score, alertas)
- S3: MAXXXI Insights — cards de análise automática
- S4: Gráfico barras receita×despesa×resultado + ranking por resultado
- S5: Gargalos automáticos + Top 5 prioridades com ação sugerida
- S6: Tabela comparativa 7 métricas × empresas + exportar CSV
- S7: Pipeline CRM funil por empresa + patrimônio GP
- S8: Central de alertas por criticidade
- CEO Intelligence: identificar melhor/pior empresa, gargalos, prioridades

### MAXXXI (v16+)
- Drawer lateral (não chat flutuante)
- Badge de alertas no topbar e sidebar
- Briefing automático na primeira abertura do dia
- Chat com API Anthropic + fallback local
- Alertas não lidos no topo do drawer

### Supabase (v19)
- Client via CDN @supabase/supabase-js@2
- Configuração via menu usuário → ⚙️ Supabase
- Sync bidirecional: startup puxa → localStorage; writes → ambos
- Entidades sincronizadas: lancamentos, tarefas, CRM, notas, agenda, alertas, checkins, empresas
- Fallback automático: sem Supabase configurado, tudo funciona via localStorage
- Storage buckets: avatars (público), logos (público), biblioteca (privado)

### Interface (v12)
- Barra de empresas no topo do workspace removida
- Módulos configuráveis por empresa (checklist ao criar)
- GP enxuto: apenas KPIs, Financeiro, Notas, Arquivos
- Convite de usuário: modal com email, role, empresas, expiração, link copiável
- Tarefas e CRM filtrados por curEmp
- Favicon SVG constelação Orion (7 estrelas, Betelgeuse dourada)
- PWA manifest com ícone SVG

### Integridade
- Braces balanceadas: 870/870
- Zero NaN em HTML estático
- Zero duplicate style attributes
- renderTab guard contra curEmp null
- FMT.score retorna mínimo 50 (nunca 0)
- Health score com fallback consistente

## Variáveis de Ambiente

| Variável           | Onde                    | Obrigatório |
|--------------------|-------------------------|-------------|
| orion_api_key      | localStorage (runtime)  | Não — MAXXXI funciona com fallback local |
| orion_sb_url       | localStorage (runtime)  | Não — app funciona 100% com localStorage |
| orion_sb_key       | localStorage (runtime)  | Não — idem |
| VITE_ANTHROPIC_KEY | .env (não usado runtime) | Não |

## Deploy (Vercel)

1. Push para `main` no repo **ORION** (`maxwellmachadoadm-ui/ORION`)
2. Vercel detecta automaticamente e deploya
3. `vercel.json` configura:
   - `index.html` como build estático
   - `public/**` servido com rotas para manifest.json e orion-logo.svg
   - SPA routing: todas as rotas → index.html
4. Sem variáveis de ambiente no Vercel necessárias (tudo é client-side)

## Tabelas Supabase

| Tabela           | company_id | Status    |
|------------------|------------|-----------|
| empresas         | ✅ PK      | Conectada |
| lancamentos      | ✅ SIM     | Conectada |
| tarefas          | ✅ SIM     | Conectada |
| crm_itens        | ✅ SIM     | Conectada |
| notas            | ✅ SIM     | Conectada |
| leads            | ✅ SIM     | Pronta    |
| invites          | — global   | Pronta    |
| empresa_modulos  | ✅ SIM     | Pronta    |
| agenda           | — global   | Conectada |
| alertas          | — global   | Conectada |
| checkins         | — global   | Conectada |
| categorias       | ✅ SIM     | Conectada |
