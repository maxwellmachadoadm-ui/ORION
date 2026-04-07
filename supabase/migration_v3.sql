-- ============================================================
-- ORION Gestão Executiva — Migration v3
-- Biblioteca, Compromissos Financeiros, Módulos por Empresa
-- ============================================================

-- Biblioteca
CREATE TABLE IF NOT EXISTS biblioteca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  url TEXT,
  descricao TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view biblioteca of their companies" ON biblioteca
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert biblioteca" ON biblioteca
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can delete biblioteca" ON biblioteca
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Compromissos financeiros
CREATE TABLE IF NOT EXISTS compromissos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  frequencia TEXT DEFAULT 'mensal',
  tipo TEXT DEFAULT 'recorrente',
  categoria TEXT,
  banco TEXT,
  status TEXT DEFAULT 'a_vencer',
  pago_em TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage compromissos of their companies" ON compromissos
  FOR ALL USING (true);

-- Módulos por empresa
CREATE TABLE IF NOT EXISTS empresa_modulos (
  empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  PRIMARY KEY (empresa_id, modulo)
);
ALTER TABLE empresa_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage empresa_modulos" ON empresa_modulos
  FOR ALL USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('orion-assets', 'orion-assets', true) ON CONFLICT DO NOTHING;
