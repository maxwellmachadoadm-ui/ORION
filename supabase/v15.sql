-- ORION v15 — Schema Supabase: lancamentos, tarefas, leads, invites, empresa_modulos
-- Executar no Supabase SQL Editor

-- ══════════════════════════════════════════════
-- LANCAMENTOS
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense','transfer','investment')),
  category text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text DEFAULT '',
  origin text DEFAULT 'manual',
  impacta_resultado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos_auth" ON public.lancamentos FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_lancamentos_company ON public.lancamentos(company_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_date ON public.lancamentos(date);
CREATE INDEX IF NOT EXISTS idx_lancamentos_type ON public.lancamentos(type);

-- ══════════════════════════════════════════════
-- TAREFAS
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'media',
  due_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarefas_auth" ON public.tarefas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_tarefas_company ON public.tarefas(company_id);

-- ══════════════════════════════════════════════
-- LEADS
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  stage text DEFAULT 'Lead',
  value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_auth" ON public.leads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(company_id);

-- ══════════════════════════════════════════════
-- INVITES
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text DEFAULT 'viewer',
  companies_access jsonb DEFAULT '[]'::jsonb,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_auth" ON public.invites FOR ALL USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════
-- EMPRESA MODULOS
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.empresa_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL UNIQUE,
  modulos jsonb DEFAULT '["KPIs","OKRs","Tarefas","Financeiro","Contratos","Riscos","Decisões","CRM","Notas","Arquivos"]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.empresa_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa_modulos_auth" ON public.empresa_modulos FOR ALL USING (auth.uid() IS NOT NULL);
