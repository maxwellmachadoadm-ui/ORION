# ORION — Changelog

## [v1.1.0] — em desenvolvimento (branch `release/v1.1.0-finance-engine-multiempresa`)

### FASE 1 — Extrato IA completo por empresa
- Upload drag & drop expandido: PDF, XLSX, CSV, TXT, DOC/DOCX, imagens
- `eiaClassifyWithAI()` chama Claude API (claude-sonnet-4) com resposta JSON estruturada `{entries:[{date,description,amount,type,suggestedCategory,confidence}]}`; fallback local `eiaParseEntries` quando sem API key
- Campo `type` (entrada/saida) explícito em cada entry · coluna "Tipo" + "Origem" (IA/local) na tabela
- Storage mirror `orion_eia_<empId>` (spec v1.1) + mantém `orion_extrato_ia_<empId>` (compat)
- Estados de progresso claros por arquivo: enviando → processando → classificando → concluído | ✕ erro
- Supabase sync via tabela `extrato_ia` existente mantida

### FASE 2 — Lançamentos unificados por empresa
- Nova aba "Lançamentos" em todas as empresas (8ª tab)
- `lancGetUnified()` agrega lançamentos manuais (`orion_lanc_<empId>`) + EIA approved entries
- Shape unificado: `{id, data, descricao, valor, tipo, categoria, origem, status, deleted}`
- Status: pendente · aprovado · corrigido · rejeitado · excluído
- Filtros: período (month), categoria, tipo, status, busca texto
- Ações por linha: editar (modal), aprovar, rejeitar, excluir (soft delete)
- Soft delete preserva registro com `deleted:true` + `status='excluído'`
- Regra contábil: só `status='aprovado'` entra em `calcularDRE` e `calcularFluxoCaixa` (exclui rejeitados e excluídos)
- EIA approved entries agregam automaticamente em DRE/fluxo mensal

### FASE 2B — Supabase Auth (login + recuperação de senha)
- `doLogin` tenta `sb.auth.signInWithPassword` primeiro; fallback p/ auth local se Supabase indisponível ou credencial não encontrada
- `forgotPassword` usa `sb.auth.resetPasswordForEmail` (fluxo oficial) com fallback Resend
- Nova tela de redefinição de senha (`#reset-form`) exibida quando URL contém `type=recovery` ou `#recover`
- `doResetPassword` chama `sb.auth.updateUser({password})` — valida ≥8 caracteres + confirmação
- Validação de formato de e-mail em login e reset
- Mensagens claras: enviado · senha atualizada · link inválido/expirado · erro de rede · senha fraca
- `authDetectRecovery` roda antes de `autoLogin` no `DOMContentLoaded`

---

## [v1.0.0] — 2026-04-17

### Plataforma
- Central do CEO — dashboard executivo com prioridades, KPIs consolidados, portfólio de empresas
- Multi-empresa: Doctor Wealth, Original Fotografia, Forme Seguro, CDL Itaperuna, Gestão Pessoal
- Sidebar com dots coloridos por empresa e health score
- Topbar com MAXXXI, notificações e avatar

### Módulos por empresa
- KPIs, Financeiro, Extrato IA, Documentos, Relatórios, Tarefas, Notas
- Forme Seguro: Rentabilidade (36 meses dados reais Med Vet UVV), Projeções, Fundos

### IA
- MAXXXI — agente executivo com análise de ecossistema
- Extrato IA — upload CSV/OFX/XLSX/imagem com classificação automática
- ORION Decision Engine — recomendações rule-based

### Infraestrutura
- Deploy automático MAXXXI → ORION → Vercel via GitHub Actions
- Supabase conectado (auth, dados, storage)
- Fontes Syne + DM Sans embedadas em base64
- PWA instalável

### Segurança
- RBAC por empresa/módulo
- Rate limit login (5 tentativas/15min)
- Session timeout (30min)
- Audit log completo
