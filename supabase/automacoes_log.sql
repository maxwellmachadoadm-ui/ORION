-- Tabela de log de automações LinkSync
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.automacoes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  tipo text NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.automacoes_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automacoes_log_select" ON public.automacoes_log;
CREATE POLICY "automacoes_log_select" ON public.automacoes_log
FOR SELECT USING (true);

DROP POLICY IF EXISTS "automacoes_log_insert" ON public.automacoes_log;
CREATE POLICY "automacoes_log_insert" ON public.automacoes_log
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
