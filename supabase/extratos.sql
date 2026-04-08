-- Tabelas para Extratos com IA — Gestão Pessoal
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.extratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  nome_arquivo text,
  banco text,
  periodo text,
  status text DEFAULT 'processando',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extrato_id uuid REFERENCES public.extratos(id) ON DELETE CASCADE,
  data date,
  descricao text,
  valor numeric,
  tipo text,
  categoria text,
  subcategoria text,
  status_validacao text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regras_classificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  descricao_pattern text,
  categoria text,
  subcategoria text,
  confirmacoes integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, descricao_pattern)
);

-- RLS
ALTER TABLE public.extratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_classificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extratos_user" ON public.extratos;
CREATE POLICY "extratos_user" ON public.extratos FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transacoes_user" ON public.transacoes;
CREATE POLICY "transacoes_user" ON public.transacoes FOR ALL USING (
  extrato_id IN (SELECT id FROM public.extratos WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "regras_user" ON public.regras_classificacao;
CREATE POLICY "regras_user" ON public.regras_classificacao FOR ALL USING (auth.uid() = user_id);
