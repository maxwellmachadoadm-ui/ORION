-- ORION — Persistência completa no Supabase
-- Tabelas adicionais para dados que estavam apenas no localStorage

-- Arquivos metadata
CREATE TABLE IF NOT EXISTS public.arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text,
  user_id uuid REFERENCES auth.users(id),
  nome text NOT NULL,
  tipo text,
  tamanho integer,
  url text,
  categoria text,
  subcategoria text,
  mes_competencia text,
  status text DEFAULT 'pendente',
  uploaded_by text,
  uploaded_name text,
  descricao text,
  created_at timestamptz DEFAULT now()
);

-- Patrimônio pessoal
CREATE TABLE IF NOT EXISTS public.patrimonio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  imoveis numeric DEFAULT 0,
  investimentos numeric DEFAULT 0,
  participacoes numeric DEFAULT 0,
  veiculos numeric DEFAULT 0,
  previdencia numeric DEFAULT 0,
  dividas numeric DEFAULT 0,
  historico jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- Extratos GP (transações classificadas pelo MAXXXI)
CREATE TABLE IF NOT EXISTS public.extratos_gp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  data text,
  descricao text,
  valor numeric,
  categoria text,
  subcategoria text,
  confianca text,
  status text DEFAULT 'pendente',
  origem text,
  created_at timestamptz DEFAULT now()
);

-- Regras aprendidas pelo MAXXXI (extratos)
CREATE TABLE IF NOT EXISTS public.extratos_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  pattern text NOT NULL,
  categoria text NOT NULL,
  subcategoria text,
  count integer DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pattern)
);

-- Extratos histórico de uploads
CREATE TABLE IF NOT EXISTS public.extratos_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  arquivo text,
  banco text,
  qtd integer,
  created_at timestamptz DEFAULT now()
);

-- OF Financeiro — projetos (localStorage → Supabase)
-- Nota: tabela of_projetos já existe, mas dados demo estão no localStorage
-- Vamos usar a tabela existente

-- RLS
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_gp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arquivos_auth" ON public.arquivos;
CREATE POLICY "arquivos_auth" ON public.arquivos FOR ALL USING (true);
DROP POLICY IF EXISTS "patrimonio_user" ON public.patrimonio;
CREATE POLICY "patrimonio_user" ON public.patrimonio FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_gp_user" ON public.extratos_gp;
CREATE POLICY "extratos_gp_user" ON public.extratos_gp FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_regras_user" ON public.extratos_regras;
CREATE POLICY "extratos_regras_user" ON public.extratos_regras FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "extratos_hist_user" ON public.extratos_historico;
CREATE POLICY "extratos_hist_user" ON public.extratos_historico FOR ALL USING (auth.uid() = user_id);
