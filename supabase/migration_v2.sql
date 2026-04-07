-- ORION v2 Migration — Design System + Company Management
-- Executar no Supabase Dashboard > SQL Editor

-- 1. Adicionar logo_url na tabela empresas
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Criar tabela de controle de acesso por empresa
CREATE TABLE IF NOT EXISTS public.user_empresa_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id TEXT NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, empresa_id)
);

-- 3. RLS para user_empresa_access
ALTER TABLE public.user_empresa_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus próprios acessos" ON public.user_empresa_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin gerencia acessos" ON public.user_empresa_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. RLS empresas — usuário só vê empresas que tem acesso (admin vê todas)
DROP POLICY IF EXISTS "empresas_select" ON public.empresas;
CREATE POLICY "empresas_select" ON public.empresas
  FOR SELECT USING (
    -- Admin vê tudo
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Usuário vê apenas empresas autorizadas
    EXISTS (SELECT 1 FROM public.user_empresa_access WHERE user_id = auth.uid() AND empresa_id = id)
  );

-- 5. Bucket no Storage para logos (executar no Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('orion-assets', 'orion-assets', true);
-- CREATE POLICY "Public read logos" ON storage.objects FOR SELECT USING (bucket_id = 'orion-assets');
-- CREATE POLICY "Admin upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'orion-assets' AND auth.role() = 'authenticated');

COMMENT ON TABLE public.user_empresa_access IS 'Controla quais empresas cada usuário pode acessar na plataforma ORION';
