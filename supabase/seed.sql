-- ORION — Seed Data
-- Execute DEPOIS do schema.sql

-- Empresas
insert into public.empresas (id, nome, sigla, descricao, cor, rgb, score, status, status_cor, faturamento, meta, resultado, crescimento, drive_url) values
  ('dw', 'Doctor Wealth', 'DW', 'Ecossistema Financeiro Medico', '#3b82f6', '59,130,246', 80, 'Crescimento', '#10b981', 48500, 60000, 22000, 18.4, 'https://drive.google.com'),
  ('of', 'Original Fotografia', 'OF', 'Estudio & Eventos Visuais', '#f59e0b', '245,158,11', 52, 'Turnaround', '#f59e0b', 28000, 35000, 4200, -4.2, 'https://drive.google.com'),
  ('fs', 'Forme Seguro', 'FS', 'Fundos de Formatura Premium', '#8b5cf6', '139,92,246', 65, 'Lancamento', '#06b6d4', 15000, 50000, 8500, 50, 'https://drive.google.com'),
  ('cdl', 'CDL ITAPERUNA', 'CDL', 'Camara de Dirigentes Lojistas Itaperuna', '#10b981', '16,185,129', 88, 'Estavel', '#10b981', 35000, 40000, 12000, 5.3, 'https://drive.google.com'),
  ('gp', 'Gestao Pessoal', 'GP', 'Patrimonio & Financas Pessoais', '#ec4899', '236,72,153', 75, 'Saudavel', '#10b981', 0, 0, 0, 0, 'https://drive.google.com');

-- KPIs
insert into public.kpis (empresa_id, icone, label, valor, ordem) values
  ('dw','👥','Clientes Ativos','47 / 60',1),('dw','🔄','Receita Recorrente','R$ 38k/mes',2),('dw','⚠','Inadimplencia','3,2%',3),('dw','🎯','Ticket Medio','R$ 1.031',4),
  ('of','👥','Clientes Ativos','22 / 30',1),('of','📊','Margem Liquida','15%',2),('of','🚨','Inadimplencia','8,7%',3),('of','🏢','Custo Fixo','R$ 18,5k/mes',4),
  ('fs','🎓','Fundos Gerenciados','3 turmas',1),('fs','💰','Capital Gerenciado','R$ 420k',2),('fs','✅','Inadimplencia','0%',3),('fs','🚀','Pipeline','5 turmas',4),
  ('cdl','🏪','Associados','1.100',1),('cdl','💼','Receita Associativa','R$ 30k/mes',2),('cdl','✅','Taxa Adimplencia','97,9%',3),('cdl','📅','Eventos no Ano','12',4),
  ('gp','🏦','Patrimonio Estimado','R$ 1,2M',1),('gp','💰','Renda Total','R$ 52k/mes',2),('gp','📈','Investimentos','R$ 380k',3),('gp','🎯','Taxa de Poupanca','42%',4);

-- OKRs
insert into public.okrs (empresa_id, objetivo, progresso) values
  ('dw','Atingir 60 clientes medicos',78),('dw','Reduzir inadimplencia para 2%',45),('dw','Lancar DW Academy',30),
  ('of','Reduzir inadimplencia para 4%',35),('of','Atingir 30 clientes ativos',73),('of','Lancar pacote corporativo',20),
  ('fs','Fechar 12 contratos em 2026',25),('fs','Atingir R$ 2M gerenciados',21),('fs','Lancar app Forme Digital',10),
  ('cdl','Atingir 1.200 associados',92),('cdl','Lancar Hub CDL — Sebrae',60),('cdl','Digitalizar 80% dos processos',40),
  ('gp','Atingir R$ 1,5M patrimonio',80),('gp','Investir R$ 10k/mes',65),('gp','Quitar financiamento imovel',45);

-- Tarefas
insert into public.tarefas (titulo, empresa_id, prioridade, status) values
  ('Pitch para 3 clinicas — BH','dw','alta','todo'),('Onboarding Dr. Felipe e Dra. Ana','dw','alta','todo'),
  ('Proposta Dr. Marcos Vinicius','dw','media','todo'),('Calendario Instagram Abril','dw','baixa','done'),
  ('Cobrancas — 3 clientes atrasados','of','alta','todo'),('Reuniao equipe — corte de custos','of','alta','todo'),
  ('Calendario de ensaios Q2','of','media','todo'),('Revisao contrato fornecedor','of','media','done'),
  ('Fechar UNIFENAS — Medicina 2026','fs','alta','todo'),('Proposta para UNIFAL','fs','alta','todo'),
  ('Configurar agente IA WhatsApp','fs','media','todo'),('Planilha fundos ativos','fs','media','done'),
  ('Reuniao Hub CDL com Sebrae','cdl','alta','todo'),('Aprovacao pauta assembleia Abril','cdl','alta','todo'),
  ('Relatorio mensal para diretoria','cdl','media','done'),('Captacao novos associados','cdl','baixa','todo'),
  ('Declaracao IRPF 2026','gp','alta','todo'),('Revisar carteira de investimentos','gp','media','todo'),
  ('Renovar seguro de vida','gp','media','todo'),('Planejamento viagem familia','gp','baixa','todo');

-- Contratos
insert into public.contratos (empresa_id, nome, valor, status, vencimento) values
  ('dw','Contrato Padrao Medicos','R$ 890/mes','ativo','Dez/2026'),('dw','Plano Elite — Dr. Carvalho','R$ 2.400/mes','ativo','Jun/2026'),
  ('of','Parceria Evento Casa Casada','R$ 3.500/evento','ativo','Dez/2026'),('of','Cliente Corporativo XYZ','R$ 1.800/mes','inadim','Mai/2026'),
  ('fs','Fundo UNIFENAS Med 2026','R$ 5.000/mes','ativo','Dez/2026'),('fs','Fundo UNILAVRAS Med 2025','R$ 6.200/mes','ativo','Jun/2025'),
  ('cdl','Parceria Sebrae — Hub Inovacao','Institucional','negoc','Abr/2026'),('cdl','Contrato Feira do Empreendedor','R$ 8.000','ativo','Mai/2026'),
  ('gp','Financiamento Imovel — CEF','R$ 2.100/mes','ativo','Dez/2031'),('gp','Previdencia Privada PGBL','R$ 1.500/mes','ativo','Vitalicio');

-- Riscos
insert into public.riscos (empresa_id, descricao, nivel) values
  ('dw','Entrada de concorrente especializado no nicho medico','alto'),('dw','Regulacao CFC sobre contadores especializados','medio'),
  ('of','Sazonalidade — queda Q1 e Q3 todo ano','alto'),('of','Equipamento principal precisa revisao urgente','medio'),
  ('fs','Concorrencia de bancos tradicionais nos fundos','medio'),('fs','Dependencia total de captacao via indicacao','alto'),
  ('cdl','Queda no varejo regional impacta associacoes','medio'),('cdl','Renovacao de diretoria Nov/2026','baixo'),
  ('gp','Concentracao de renda em empresas proprias','alto'),('gp','Falta de diversificacao internacional','medio');

-- Decisoes
insert into public.decisoes (empresa_id, descricao, data) values
  ('dw','Lancar vertical de planejamento patrimonial','Mar/2026'),('dw','Contratar 2o contador senior','Abr/2026'),
  ('of','Reestruturacao completa de precificacao','Mar/2026'),('of','Definir nicho: corporativo vs social','Abr/2026'),
  ('fs','Contratar comercial dedicado para novas turmas','Abr/2026'),('fs','Criar landing page Forme Seguro','Mar/2026'),
  ('cdl','Aprovar projeto Hub CDL','Abr/2026'),('cdl','Parceria SENAC para cursos','Mar/2026'),
  ('gp','Aportar em FII — MXRF11','Mar/2026'),('gp','Contratar assessor de investimentos','Abr/2026');

-- CRM Leads
insert into public.crm_leads (empresa_id, fase, nome, valor) values
  ('dw','Lead','Dr. Bruno Alves','R$ 1.200/mes'),('dw','Lead','Clinica Santa Clara','R$ 3.500/mes'),
  ('dw','Proposta','Dr. Renata Souza','R$ 890/mes'),('dw','Negociacao','Dr. Marcos Vinicius','R$ 2.100/mes'),
  ('dw','Fechado','Dr. Felipe Costa','R$ 890/mes'),
  ('of','Lead','Turma Direito UFMG 2027','Projeto 3 anos'),('of','Lead','Evento Empresa XYZ','R$ 4.500'),
  ('of','Proposta','Formatura Medicina BH','Projeto 4 anos'),('of','Fechado','Casamento Silva','R$ 8.000'),
  ('fs','Lead','UNIFAL Medicina 2027','Projeto 5 anos'),('fs','Lead','UFLA Medicina 2026','Projeto 4 anos'),
  ('fs','Proposta','UNIFENAS Odonto 2026','Projeto 3 anos'),('fs','Negociacao','UNIMONTES Med 2026','Projeto 4 anos'),
  ('fs','Fechado','UNIFENAS Med 2026','R$ 5.000/mes'),
  ('cdl','Lead','Grupo Supermercados BH','Novo associado'),('cdl','Lead','Rede Farmacias Local','Novo associado'),
  ('cdl','Negociacao','Franquia Fast Food','R$ 280/mes'),('cdl','Fechado','Loja Roupas Centro','R$ 185/mes');
