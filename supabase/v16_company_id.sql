-- ORION v16 — Multiempresa: empresa_id em todas as tabelas
-- Executar no Supabase SQL Editor

-- Adicionar empresa_id onde está faltando
ALTER TABLE public.extratos ADD COLUMN IF NOT EXISTS empresa_id text DEFAULT 'gp';
ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS empresa_id text DEFAULT 'gp';
ALTER TABLE public.maxxxi_alertas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.maxxxi_conversas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa ON public.lancamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa ON public.tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON public.leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_empresa ON public.compromissos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_of_lancamentos_projeto ON public.of_lancamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_of_parcelas_projeto ON public.of_parcelas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_maxxxi_alertas_empresa ON public.maxxxi_alertas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_maxxxi_conversas_empresa ON public.maxxxi_conversas(empresa_id);
