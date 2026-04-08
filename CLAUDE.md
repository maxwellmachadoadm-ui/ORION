# ORION — Plataforma de Gestão Executiva

## Arquitetura

- **Tipo**: Single-file static HTML app (`index.html`)
- **Deploy**: Vercel (static build via `@vercel/static`)
- **Framework**: Vanilla JS, CSS-in-file, no build tools
- **Fontes**: DM Sans (body), Syne (headings/valores)
- **Persistência**: localStorage (prefixo `orion_`)
- **IA**: Anthropic API (claude-sonnet-4-20250514) com fallback local

## Estrutura de Arquivos

```
/
├── index.html        # App inteiro (HTML + CSS + JS)
├── vercel.json       # Config deploy Vercel (static + SPA routing)
├── .env              # VITE_ANTHROPIC_KEY (não utilizado no runtime)
├── README.md         # Descrição básica
├── CLAUDE.md         # Este arquivo
└── supabase/
    └── v16_company_id.sql  # Migration para futuro Supabase
```

## Empresas (5 ativas)

| ID   | Nome               | Sigla | Tipo           | Health Score |
|------|--------------------|-------|----------------|--------------|
| dw   | Doctor Wealth      | DW    | Portfólio      | 80           |
| of   | Original Fotografia| OF    | Portfólio      | 52           |
| fs   | Forme Seguro       | FS    | Portfólio      | 65           |
| cdl  | CDL Divinópolis    | CDL   | Portfólio      | 88           |
| gp   | Gestão Pessoal     | GP    | Pessoal        | 75           |

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
  - `orion_agenda` — agenda global
  - `orion_alerts` — alertas
  - `orion_ci_{date}` — check-in diário

## Diagnóstico v16

### Tabelas Supabase (planejadas, não conectadas)
O app atual NÃO usa Supabase — tudo é localStorage. As tabelas abaixo são planejamento futuro:

| Tabela              | empresa_id | Status        |
|---------------------|------------|---------------|
| lancamentos         | ✅ SIM     | Planejada     |
| tarefas             | ✅ SIM     | Planejada     |
| leads               | ✅ SIM     | Planejada     |
| compromissos        | ✅ SIM     | Planejada     |
| extratos            | ❌ NÃO     | Precisa ADD   |
| transacoes          | ❌ NÃO     | Precisa ADD   |
| of_lancamentos      | via projeto_id | Planejada |
| of_parcelas         | via projeto_id | Planejada |
| maxxxi_alertas      | ✅ SIM     | Planejada     |
| maxxxi_conversas    | ✅ SIM     | Planejada     |

### Riscos Identificados
1. Sem Supabase: dados vivem apenas no localStorage do browser
2. Sem empresa_id enforcement: quando Supabase for conectado, todas queries precisarão filtrar
3. API key do Anthropic armazenada em localStorage (risco de segurança)

### Inconsistências Corrigidas na v16
- empresaAtiva agora persiste em localStorage entre sessões
- Home dividida em PORTFÓLIO (DW, OF, FS, CDL) e PESSOAL (GP)
- MAXXXI migrado de chat flutuante para drawer lateral
- Badge de alertas no topbar
- Sidebar com hierarquia visual clara

## Variáveis de Ambiente

| Variável            | Uso                    | Onde           |
|---------------------|------------------------|----------------|
| VITE_ANTHROPIC_KEY  | API Anthropic (MAXXXI) | .env (não usado runtime) |
| orion_api_key       | API key em localStorage | Runtime browser |

## Deploy (Vercel)

- `vercel.json` configura build estático e SPA routing
- Sem crons configurados (app é 100% client-side)
