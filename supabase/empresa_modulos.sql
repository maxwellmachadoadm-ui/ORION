-- Tabela de módulos configuráveis por empresa
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.empresa_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  modulo text NOT NULL,
  ativo boolean DEFAULT true,
  UNIQUE(empresa_id, modulo)
);

-- RLS
ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_modulos_select" ON public.empresa_modulos;
CREATE POLICY "empresa_modulos_select" ON public.empresa_modulos
FOR SELECT USING (true);

DROP POLICY IF EXISTS "empresa_modulos_admin" ON public.empresa_modulos;
CREATE POLICY "empresa_modulos_admin" ON public.empresa_modulos
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
