# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Sempre responder em português.**

## Projeto ORION

Plataforma executiva de **Maxwell Oliveira Machado** — CEO, Contador, Presidente CDL Divinópolis/MG.

### Empresas do Ecossistema

- **Doctor Wealth (DW)** — Contabilidade médica, 47 clientes, R$ 48,5k/mês
- **Original Fotografia (OF)** — Estúdio, em turnaround
- **Forme Seguro (FS)** — Fundos de formatura, R$ 420k gerenciados
- **CDL Divinópolis (CDL)** — 1.100 associados
- **Gestão Pessoal (GP)** — Patrimônio R$ 1,2M

### Stack

- **Frontend**: React + Vite (atualmente standalone `index.html`, migração planejada)
- **Deploy**: Vercel
- **API**: Anthropic Claude (MAXXXI — agente executivo IA)

## Development

- **Run**: Open `index.html` directly in a browser. No server required.
- **No build step, no tests, no linter.**

## Architecture

The app is a vanilla JS SPA with these core sections, all rendered client-side:

- **Auth**: Login/register with localStorage persistence. Default user: `maxwell@orion.app` / `orion2026`.
- **Home**: KPI cards, company grid, agenda, live market feed, daily check-in.
- **Dashboard**: Revenue bar charts (CSS-based), donut chart (SVG), sparklines, health scores, performance vs meta.
- **Tasks (Kanban)**: Full CRUD task module with Kanban board (todo/doing/done), filters by priority and company, localStorage persistence. Tasks are seeded from `EMPS` data on first load.
- **CEO View**: Ranking and revenue distribution across companies.
- **Workspace**: Per-company views with tabs (KPIs, OKRs, Tarefas, Contratos, Riscos, Decisoes, CRM, Arquivos).
- **MAXXXI Chat**: AI assistant panel using Anthropic Claude API. Falls back to hardcoded local responses when no API key is configured.

### Key Data Structures

- `EMPS` object: All company data (DW, OF, FS, CDL, GP) including KPIs, OKRs, tasks, contracts, risks, decisions, CRM pipelines.
- Tasks stored in `localStorage` under key `orion_tasks`.
- API key stored in `localStorage` under key `orion_api_key`.
- All localStorage keys are prefixed with `orion_`.

### Navigation

Page switching is handled by `showPage(pg)` which toggles visibility of `page-home`, `page-dashboard`, `page-tasks`, `page-ceo`, `page-ws` divs. Sidebar items call `goHome()`, `goDashboard()`, `goTasks()`, `goCEO()`, `openEmp(id)`.

### Claude API Integration

The MAXXXI chat calls `https://api.anthropic.com/v1/messages` directly from the browser using `anthropic-dangerous-direct-browser-access` header. API key and model are configured via a modal and stored in localStorage. The system prompt in `buildSystemPrompt()` includes live task data and company metrics.

## Conventions

- Language: Brazilian Portuguese (pt-BR) for all UI text.
- CSS uses custom properties defined in `:root` (color palette, border radius).
- Font stack: Syne (headings), DM Sans (body) via Google Fonts.
- No external JS dependencies.
