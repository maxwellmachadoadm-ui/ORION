# CLAUDE.md — ORION Gestão Executiva

**Sempre responder em português.**
**Sempre ler este arquivo COMPLETO antes de qualquer ação.**

---

## Identidade da Plataforma

- **Nome oficial:** ORION Gestão Executiva
- **Agente IA:** MAXXXI (chat flutuante CFO Virtual)
- **Proprietário:** Maxwell Oliveira Machado — CEO, Contador, Presidente CDL ITAPERUNA/MG
- **URL Produção:** https://orion-platform-wine.vercel.app
- **GitHub:** https://github.com/maxwellmachadoadm-ui/ORION
- **Título do browser:** ORION Gestão Executiva

---

## Ecossistema de Empresas

| ID  | Nome                  | Sigla | Status       | Score |
|-----|-----------------------|-------|--------------|-------|
| dw  | Doctor Wealth         | DW    | Crescimento  | 80    |
| of  | Original Fotografia   | OF    | Turnaround   | 52    |
| fs  | Forme Seguro          | FS    | Lançamento   | 65    |
| cdl | CDL ITAPERUNA         | CDL   | Estável      | 88    |
| gp  | Gestão Pessoal        | GP    | Saudável     | 75    |

**IMPORTANTE:** CDL ITAPERUNA (nunca "CDL Divinópolis"). IDs base (dw, of, fs, cdl, gp) NÃO podem ser deletados.

---

## Stack Técnica

- **Frontend:** React 19 + Vite 6 (SPA)
- **Roteamento:** React Router DOM v7
- **Backend:** Supabase (PostgreSQL + Storage + Auth + RLS)
- **Deploy:** Vercel (Serverless Functions + Cron Jobs)
- **IA:** Anthropic Claude API (MAXXXI)
- **Email:** Resend API (relatório semanal todo domingo)
- **Fontes:** DM Sans + DM Mono (Google Fonts)

---

## Arquitetura de Contextos

- **AuthContext** — Auth, ROLES (admin/gestor/colaborador/contador/assistente/pendente), permissões, `canDelete = profile?.role === 'admin'`, `inviteUser(email, role, companiesAccess, permissions)`
- **DataContext** — Dados das empresas, `calculateHealthScore`, `getCashFlow`, `getDRE`, `getPipeline`, `generateAlertsV5`, `addEmpresa`, `removeEmpresa`, `uploadLogoEmpresa`
- **AppContext** — `presentationMode`, `togglePresentation()`

---

## Módulos Implementados

### Páginas
- **Home** — KPIs consolidados, health score rings, agenda manual, check-in diário, Briefing MAXXXI
- **Dashboard** — Gráficos receita, donut SVG, sparklines, health scores, performance vs meta
- **Tasks** — Kanban (todo/doing/done), filtros prioridade e empresa, CRUD completo
- **CEO** — 7 seções: KPIs consolidados, health scores comparativos, fluxo de caixa 90d, pipeline, ranking, alertas, patrimônio
- **Workspace** — 11 abas: KPIs, OKRs, Tarefas, Contratos, Riscos, Decisões, CRM, Pipeline, Fluxo de Caixa, DRE, Arquivos (+ Patrimônio para GP)
- **Financeiro** — 5 abas: Resumo, Por Banco, Por Natureza, Lançamentos, Comparativo
- **Arquivo Digital** — Upload drag & drop, classificação automática MAXXXI, fila de aprovação
- **Classificações** — CLASSIFICATION_BANK com 7 grupos, padrões aprendidos
- **Admin** — 4 abas: Usuários, Empresas (CRUD + logo), Auditoria, Log MAXXXI
- **Login** — Auth com Supabase ou localStorage demo

### Componentes
- **Layout** — Topbar 52px (saudação compacta + data), sidebar 200px gradiente dourado
- **OrionLogo** — SVG 32×32 constelação Orion com gradiente azul
- **Maxxxi** — FAB dourado 42px, chat com 3 modelos (Haiku/Sonnet/Opus), quick actions, RAG de arquivos
- **PDFExport** — Exportação executiva

### Iframes
- `/forme-seguro-v2.html` — Gestão de Fundos FS (dark mode)
- `/projecao-forme-seguro.html` — Projeções FS

---

## Design System v2

```css
--bg: #080c14        /* fundo global */
--surface: #0d1424   /* cards */
--surface2: #111827  /* inputs, rows */
--border: #1e2a3d
--border2: #2d3f5a
--blue: #3b82f6
--gold: #f59e0b      /* cor primária ORION */
--gold-dark: #d97706
--green: #10b981
--red: #ef4444
--text: #f1f5f9
--text2: #94a3b8
--text3: #64748b
--text4: #475569
```

**Tipografia:**
- Labels: 9px DM Mono uppercase letter-spacing 1.5px
- KPI valor: 16-18px weight 700
- Corpo: 12px DM Sans
- Botão primário: gradient gold, color #0d1424, 10px uppercase

---

## Credenciais Demo

- **Admin:** maxwell@orion.app / orion2026
- **Usuário padrão:** Cria conta na tela de login

---

## LocalStorage Keys

```
orion_tasks_v2         — tarefas kanban
orion_lancamentos_v4   — lançamentos financeiros
orion_audit_log        — log de auditoria
orion_maxxxi_log       — log do MAXXXI (max 500)
orion_maxxxi_learned   — classificações aprendidas
orion_maxxxi_model     — modelo Claude selecionado
orion_pending_class    — fila de classificação
orion_arquivos         — metadados de arquivos
orion_custom_empresas  — empresas customizadas
orion_agenda           — eventos da agenda
orion_ci_[DATE]        — check-in diário por data
```

---

## Supabase Schema

```sql
-- Tabelas principais
empresas (id, nome, sigla, descricao, cor, rgb, score, status, status_cor, faturamento, meta, resultado, crescimento, drive_url, logo_url)
kpis (empresa_id, icone, label, valor, ordem)
okrs (empresa_id, objetivo, progresso)
tarefas (titulo, empresa_id, prioridade, status)
contratos (empresa_id, nome, valor, status, vencimento)
riscos (empresa_id, descricao, nivel)
decisoes (empresa_id, descricao, data)
crm_leads (empresa_id, fase, nome, valor)
profiles (id, email, name, role, companies_access, permissions, expires_at)
user_empresa_access (user_id, empresa_id, granted_by, granted_at)
biblioteca (empresa_id, nome, tipo, tamanho, url, descricao, uploaded_by, uploaded_name, created_at)
compromissos (empresa_id, nome, descricao, valor, vencimento, frequencia, tipo, categoria, banco, status, pago_em, created_by)
empresa_modulos (empresa_id, modulo, ativo)
```

---

## Convenções Obrigatórias

1. **Nunca usar "CDL Divinópolis"** — sempre "CDL ITAPERUNA"
2. **Nunca chamar o agente IA de outro nome** — sempre "MAXXXI"
3. **Nunca usar "ORION" sem "Gestão Executiva"** no título/browser
4. **canDelete** é exclusivo de admin (role === 'admin')
5. **isDemoMode** = `!supabase` — toda lógica de fallback usa localStorage
6. **Componentes com hooks** devem ser declarados FORA do componente pai (ex: FluxoCaixaTab, DRETab, PipelineTab, PatrimonioTab fora de Workspace)
7. **Fonts**: DM Sans (corpo) + DM Mono (labels, badges, código)

---

## Vercel Config

- **Cron:** `api/weekly-report.js` roda domingo 23h UTC (relatório email via Resend)
- **Env vars necessários:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_TO_EMAIL`

---

## Estado Atual (Abril 2026)

### Implementado e Funcionando ✅
- Design System v2 completo (CSS + tipografia + componentes)
- Autenticação dual (Supabase/localStorage)
- Gestão de empresas (add/remove/logo) no Admin
- Controle de acesso por empresa no convite de usuários
- MAXXXI com 3 modelos (Haiku/Sonnet/Opus) + seletor no chat
- Health Score colorido (verde/amarelo/vermelho)
- Fluxo de Caixa com alertas de saldo negativo
- DRE por empresa com comparativo mensal
- Pipeline (Garantida/Provável/Possível)
- Alertas inteligentes (5 tipos)
- Presentation Mode com botão gold no topbar
- Patrimônio GP com categorias e evolução
- Relatório semanal por email (Vercel Cron + Resend)
- CDL ITAPERUNA em todo o sistema
- iframe Forme Seguro (dark mode) e Projeções

### Novos Módulos (Abril 2026) ✅
- **Biblioteca** — Upload e gestão de documentos por empresa (drag & drop, PDF/Word/Excel/imagens, 20MB max)
- **Compromissos Financeiros** — Controle de vencimentos recorrentes com alertas (A Vencer/Vencendo/Atrasado/Pago), marcar pago com auto-avanço de data para recorrentes
- **Módulos Configuráveis por Empresa** — Admin pode ativar/desativar módulos do Workspace por empresa via painel Admin > Empresas > ⚙ Módulos
- **Lançamentos com Status** — Suporte a status rascunho/aprovado/cancelado nos lançamentos financeiros

### LocalStorage Keys (adicionais)
- `orion_biblioteca` — documentos da biblioteca por empresa
- `orion_compromissos` — compromissos financeiros
- `orion_empresa_modulos` — módulos ativos por empresa

### Correções v7 (Abril 2026) ✅
- **Login sempre pede senha** — demo mode não restaura sessionStorage; usuário sempre faz login
- **CDL ITAPERUNA** — corrigido e validado em todo o sistema (demoData, DataContext, Home, Maxxxi)
- **NaN% corrigido** — crescimento com proteção `isFinite` no Workspace; calculateHealthScore sempre retorna 0-100
- **Health Score dinâmico** — calculateHealthScore com pesos: meta 40%, margem 30%, crescimento 30%
- **Biblioteca dentro de cada empresa** — aba Biblioteca no Workspace (módulo configurável)
- **OF Projetos dentro da empresa OF** — aba "Projetos" aparece apenas quando empresa.id === 'of'
- **Sidebar reorganizada** — seções: Navegação / Portfólio / Pessoal / Administração (sem Biblioteca e OF Projetos avulsos)

### Correções v8 (Abril 2026) ✅
- **CDL ITAPERUNA definitivo** — verificado em todos os arquivos; única ocorrência de "Divinópolis" restante é em OriginalFotografia.jsx (regiões geográficas reais, não CDL)
- **NaN% no CEO.jsx** — margem e crescimento agora protegidos com `isFinite` e exibem '—' quando nulos/inválidos
- **inviteUser robusto** — modo Supabase agora tem fallback para localStorage se tabela 'invites' não existir ou sem permissão; não bloqueia o admin
- **Convites pendentes visíveis** — seção "Convites Pendentes" exibida no Admin > Usuários listando todos os convites do orion_invites
- **Uploads com erro gracioso** — uploadAvatar, uploadLogoEmpresa e uploadBibliotecaFile agora exibem mensagem clara "Bucket não configurado" ao invés de erro técnico; cada upload usa bucket dedicado (avatars/logos/biblioteca)
- **create_buckets.sql** — script SQL criado em supabase/create_buckets.sql para criar os 3 buckets + políticas RLS no Supabase
- **Login/Reset senha verificados** — fluxos corretos e sem regressão

### LocalStorage Keys (adicionais v8)
- `orion_invites` — convites registrados pelo admin (demo + fallback Supabase)

### Correções v9 (Abril 2026) ✅
- **Design System unificado** — index.css com todas as variáveis CSS verificadas (--purple, --gold-dark, etc.)
- **Dark mode forme-seguro-v2.html** — variáveis CSS reescritas para Design System ORION (--bg:#080c14, --surface:#0d1424, etc.); backgrounds claros substituídos; badges com rgba
- **Dark mode projecao-forme-seguro.html** — variáveis CSS migradas para dark (--bg:#080c14, --card:#0d1424, --soft:#111827, --border:#1e2a3d); todos os backgrounds claros e cores hardcoded substituídas; `.ok` legível no dark
- **CDL ITAPERUNA definitivo** — nenhuma ocorrência de "CDL Divinópolis/Divinopolis" nos arquivos do projeto principal (src/, supabase/, public/); DataContext já tem replace automático
- **safeVal() presente** — exportada em DataContext.jsx, disponível para uso em todas as páginas
- **Login e fluxo de recovery** — AuthContext verificado: onAuthStateChange registrado antes da flag check, PASSWORD_RECOVERY redireciona para /reset-password, SIGNED_IN seta orion_session_active, signOut remove flag, isDemoMode tratado
- **Convite: roles corretos** — Admin.jsx e Layout.jsx usam Object.entries(ROLES) para gerar options; roles válidos: admin, gestor, colaborador, contador, assistente, pendente

### Correções v10 (Abril 2026) ✅
- **Convite robusto** — validação email (trim+lowercase), verificação duplicidade, verificação se já cadastrado, status 'pendente' salvo, logs de erro detalhados
- **Workspace: empresa ativa oculta** — abas no topo não mostram a empresa que já está aberta, apenas as outras como atalhos
- **Módulos configuráveis expandidos** — ALL_MODULOS com 16 opções incluindo Gestão de Fundos, Projeções, Projetos, Patrimônio; grid 2 colunas no modal
- **Drive centralizado por empresa** — 6 pastas padrão (Financeiro/Extratos, Financeiro/NFs, Financeiro/Relatórios, Jurídico/Contratos, Operacional/Documentos, Biblioteca/Estatutos); navegação por pasta, upload por pasta, mover arquivo entre pastas, somente admin deleta
- **Automações LinkSync** — logAutomacao/getAutomacoesLog; hooks automáticos: arquivo em Extratos → MAXXXI sugere classificação; tarefa concluída → log automação
- **Drag and Drop Kanban** — HTML5 drag API nativo no Tasks.jsx; arrastar tarefas entre colunas; highlight dourado na coluna destino; card semi-transparente ao arrastar
- **Projeções FS** — iframe com background var(--bg) ao invés de #fff; Gestão de Fundos idem
- **CDL ITAPERUNA** — confirmado: zero ocorrências de "CDL Divinópolis" no código de produção

### LocalStorage Keys (adicionais v10)
- `orion_automacoes_log` — log de automações LinkSync (max 200)
- `orion_files_[ID]` — arquivos com campo `folder` para drive centralizado

### SQL Scripts novos (executar no Supabase)
- `supabase/empresa_modulos.sql` — tabela empresa_modulos com RLS
- `supabase/automacoes_log.sql` — tabela automacoes_log com RLS
- `supabase/fix_rls_avatar.sql` — políticas RLS para upload de avatar

### Correções v12 (Abril 2026) ✅
- **NaN% e Health Score** — demoData com valores reais verificados; calculateHealthScore com proteção isFinite em margem, crescimento e inadimplência; mínimo 5
- **Barra de empresas removida** — Workspace não mostra mais abas de outras empresas no topo; apenas header da empresa ativa
- **Módulos configuráveis** — Admin já tem ⚙ Módulos com 16 opções; Workspace filtra abas por getEmpresaModulos; localStorage orion_empresa_modulos
- **Tarefas filtradas** — getTarefas(empId) filtra por empresa_id (já correto)
- **CRM filtrado** — getCrmLeads(empId) filtra por empresa_id (já correto)
- **Gestão Pessoal enxuta** — GP mostra apenas: Patrimônio, KPIs, OKRs, Tarefas, Fluxo de Caixa, Arquivos (sem CRM, Pipeline, Riscos, Decisões, DRE)

### Módulos Principais Pendentes
- Integração Supabase em produção (currently demo mode)
- Supabase Storage: executar supabase/create_buckets.sql no painel do Supabase
- Executar SQL scripts: empresa_modulos.sql, automacoes_log.sql, fix_rls_avatar.sql
- Notificações push/email em tempo real

---

## Instruções para Claude Code

- **SEMPRE** ler este CLAUDE.md completo antes de qualquer implementação
- **NUNCA** perguntar confirmação — executar autonomamente
- **SEMPRE** fazer `git add` + `git commit` + `git push` ao final
- **NUNCA** usar CDL Divinópolis — sempre CDL ITAPERUNA
- **SEMPRE** manter compatibilidade com o modo demo (isDemoMode)
- **NUNCA** deletar dados do localStorage sem confirmação explícita do usuário
- Para hooks em componentes dinâmicos: criar sub-componentes fora do componente pai
- Build: `npm run build` para verificar antes do commit
