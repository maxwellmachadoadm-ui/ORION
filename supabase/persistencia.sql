-- Tabelas de persistência — dados de negócio no Supabase
-- Execute no Supabase SQL Editor

-- Lançamentos financeiros
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  tipo text NOT NULL,
  descricao text,
  valor numeric,
  categoria text,
  subcategoria text,
  banco text,
  origem text,
  mes text,
  data date,
  status text DEFAULT 'rascunho',
  anexo_nome text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tarefas
CREATE TABLE IF NOT EXISTS public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'todo',
  prioridade text DEFAULT 'media',
  responsavel text,
  prazo date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CRM Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  nome text NOT NULL,
  email text,
  telefone text,
  valor text,
  fase text DEFAULT 'Lead',
  responsavel text,
  created_at timestamptz DEFAULT now()
);

-- Compromissos financeiros
CREATE TABLE IF NOT EXISTS public.compromissos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  nome text NOT NULL,
  descricao text,
  valor numeric,
  vencimento date,
  frequencia text DEFAULT 'mensal',
  tipo text DEFAULT 'recorrente',
  categoria text,
  banco text,
  status text DEFAULT 'a_vencer',
  pago_em date,
  created_at timestamptz DEFAULT now()
);

-- Convites
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text DEFAULT 'colaborador',
  companies_access text[],
  custom_permissions text[],
  status text DEFAULT 'pendente',
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compromissos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Policies: autenticado pode tudo nos próprios dados
DROP POLICY IF EXISTS "lancamentos_auth" ON public.lancamentos;
CREATE POLICY "lancamentos_auth" ON public.lancamentos FOR ALL USING (true);

DROP POLICY IF EXISTS "tarefas_auth" ON public.tarefas;
CREATE POLICY "tarefas_auth" ON public.tarefas FOR ALL USING (true);

DROP POLICY IF EXISTS "leads_auth" ON public.leads;
CREATE POLICY "leads_auth" ON public.leads FOR ALL USING (true);

DROP POLICY IF EXISTS "compromissos_auth" ON public.compromissos;
CREATE POLICY "compromissos_auth" ON public.compromissos FOR ALL USING (true);

DROP POLICY IF EXISTS "invites_auth" ON public.invites;
CREATE POLICY "invites_auth" ON public.invites FOR ALL USING (true);
