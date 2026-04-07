// ORION — Setup Supabase tables via REST API
// Usage: node supabase/setup.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Since we can't run DDL via PostgREST, we'll use the REST API to check
// if tables exist and create data. For DDL, user must run schema.sql in the dashboard.
// BUT we can try to use the special rpc endpoint if available.

async function checkAndSeed() {
  console.log('=== ORION Supabase Setup ===\n')

  // Test connection
  console.log('1. Testando conexao...')
  const { data: test, error: testErr } = await supabase.from('empresas').select('id').limit(1)

  if (testErr && testErr.code === '42P01') {
    // Table doesn't exist - need DDL
    console.log('\n⚠ Tabelas nao encontradas.')
    console.log('→ Abra o Supabase Dashboard: ' + SUPABASE_URL)
    console.log('→ Va em SQL Editor')
    console.log('→ Cole e execute o conteudo de supabase/schema.sql')
    console.log('→ Depois execute este script novamente para inserir os dados\n')
    process.exit(1)
  }

  if (testErr) {
    console.log('Erro:', testErr.message)
    process.exit(1)
  }

  if (test && test.length > 0) {
    console.log('✅ Tabelas ja existem com dados (' + test.length + ' empresas)')
    console.log('Seed ja foi executado anteriormente.\n')

    // Show current state
    const { data: emps } = await supabase.from('empresas').select('id, nome, sigla')
    console.log('Empresas:', emps?.map(e => e.sigla).join(', '))

    const { data: tasks } = await supabase.from('tarefas').select('id')
    console.log('Tarefas:', tasks?.length || 0)

    const { data: kpis } = await supabase.from('kpis').select('id')
    console.log('KPIs:', kpis?.length || 0)

    process.exit(0)
  }

  // Tables exist but empty — seed data
  console.log('✅ Conexao OK. Tabelas existem.\n')
  console.log('2. Inserindo empresas...')

  const empresas = [
    { id:'dw', nome:'Doctor Wealth', sigla:'DW', descricao:'Ecossistema Financeiro Medico', cor:'#3b82f6', rgb:'59,130,246', score:80, status:'Crescimento', status_cor:'#10b981', faturamento:48500, meta:60000, resultado:22000, crescimento:18.4 },
    { id:'of', nome:'Original Fotografia', sigla:'OF', descricao:'Estudio & Eventos Visuais', cor:'#f59e0b', rgb:'245,158,11', score:52, status:'Turnaround', status_cor:'#f59e0b', faturamento:28000, meta:35000, resultado:4200, crescimento:-4.2 },
    { id:'fs', nome:'Forme Seguro', sigla:'FS', descricao:'Fundos de Formatura Premium', cor:'#8b5cf6', rgb:'139,92,246', score:65, status:'Lancamento', status_cor:'#06b6d4', faturamento:15000, meta:50000, resultado:8500, crescimento:50 },
    { id:'cdl', nome:'CDL ITAPERUNA', sigla:'CDL', descricao:'Câmara de Dirigentes Lojistas Itaperuna', cor:'#10b981', rgb:'16,185,129', score:88, status:'Estavel', status_cor:'#10b981', faturamento:35000, meta:40000, resultado:12000, crescimento:5.3 },
    { id:'gp', nome:'Gestao Pessoal', sigla:'GP', descricao:'Patrimonio & Financas Pessoais', cor:'#ec4899', rgb:'236,72,153', score:75, status:'Saudavel', status_cor:'#10b981', faturamento:0, meta:0, resultado:0, crescimento:0 },
  ]
  const { error: eErr } = await supabase.from('empresas').insert(empresas)
  if (eErr) { console.log('Erro empresas:', eErr.message); process.exit(1) }
  console.log('✅ 5 empresas inseridas')

  console.log('3. Inserindo KPIs...')
  const kpis = [
    {empresa_id:'dw',icone:'👥',label:'Clientes Ativos',valor:'47 / 60',ordem:1},{empresa_id:'dw',icone:'🔄',label:'Receita Recorrente',valor:'R$ 38k/mes',ordem:2},{empresa_id:'dw',icone:'⚠',label:'Inadimplencia',valor:'3,2%',ordem:3},{empresa_id:'dw',icone:'🎯',label:'Ticket Medio',valor:'R$ 1.031',ordem:4},
    {empresa_id:'of',icone:'👥',label:'Clientes Ativos',valor:'22 / 30',ordem:1},{empresa_id:'of',icone:'📊',label:'Margem Liquida',valor:'15%',ordem:2},{empresa_id:'of',icone:'🚨',label:'Inadimplencia',valor:'8,7%',ordem:3},{empresa_id:'of',icone:'🏢',label:'Custo Fixo',valor:'R$ 18,5k/mes',ordem:4},
    {empresa_id:'fs',icone:'🎓',label:'Fundos Gerenciados',valor:'3 turmas',ordem:1},{empresa_id:'fs',icone:'💰',label:'Capital Gerenciado',valor:'R$ 420k',ordem:2},{empresa_id:'fs',icone:'✅',label:'Inadimplencia',valor:'0%',ordem:3},{empresa_id:'fs',icone:'🚀',label:'Pipeline',valor:'5 turmas',ordem:4},
    {empresa_id:'cdl',icone:'🏪',label:'Associados',valor:'1.100',ordem:1},{empresa_id:'cdl',icone:'💼',label:'Receita Associativa',valor:'R$ 30k/mes',ordem:2},{empresa_id:'cdl',icone:'✅',label:'Taxa Adimplencia',valor:'97,9%',ordem:3},{empresa_id:'cdl',icone:'📅',label:'Eventos no Ano',valor:'12',ordem:4},
    {empresa_id:'gp',icone:'🏦',label:'Patrimonio Estimado',valor:'R$ 1,2M',ordem:1},{empresa_id:'gp',icone:'💰',label:'Renda Total',valor:'R$ 52k/mes',ordem:2},{empresa_id:'gp',icone:'📈',label:'Investimentos',valor:'R$ 380k',ordem:3},{empresa_id:'gp',icone:'🎯',label:'Taxa de Poupanca',valor:'42%',ordem:4},
  ]
  const { error: kErr } = await supabase.from('kpis').insert(kpis)
  if (kErr) console.log('Erro KPIs:', kErr.message); else console.log('✅ 20 KPIs inseridos')

  console.log('4. Inserindo OKRs...')
  const okrs = [
    {empresa_id:'dw',objetivo:'Atingir 60 clientes medicos',progresso:78},{empresa_id:'dw',objetivo:'Reduzir inadimplencia para 2%',progresso:45},{empresa_id:'dw',objetivo:'Lancar DW Academy',progresso:30},
    {empresa_id:'of',objetivo:'Reduzir inadimplencia para 4%',progresso:35},{empresa_id:'of',objetivo:'Atingir 30 clientes ativos',progresso:73},{empresa_id:'of',objetivo:'Lancar pacote corporativo',progresso:20},
    {empresa_id:'fs',objetivo:'Fechar 12 contratos em 2026',progresso:25},{empresa_id:'fs',objetivo:'Atingir R$ 2M gerenciados',progresso:21},{empresa_id:'fs',objetivo:'Lancar app Forme Digital',progresso:10},
    {empresa_id:'cdl',objetivo:'Atingir 1.200 associados',progresso:92},{empresa_id:'cdl',objetivo:'Lancar Hub CDL — Sebrae',progresso:60},{empresa_id:'cdl',objetivo:'Digitalizar 80% dos processos',progresso:40},
    {empresa_id:'gp',objetivo:'Atingir R$ 1,5M patrimonio',progresso:80},{empresa_id:'gp',objetivo:'Investir R$ 10k/mes',progresso:65},{empresa_id:'gp',objetivo:'Quitar financiamento imovel',progresso:45},
  ]
  const { error: oErr } = await supabase.from('okrs').insert(okrs)
  if (oErr) console.log('Erro OKRs:', oErr.message); else console.log('✅ 15 OKRs inseridos')

  console.log('5. Inserindo tarefas...')
  const tarefas = [
    {titulo:'Pitch para 3 clinicas — BH',empresa_id:'dw',prioridade:'alta',status:'todo'},
    {titulo:'Onboarding Dr. Felipe e Dra. Ana',empresa_id:'dw',prioridade:'alta',status:'todo'},
    {titulo:'Proposta Dr. Marcos Vinicius',empresa_id:'dw',prioridade:'media',status:'todo'},
    {titulo:'Calendario Instagram Abril',empresa_id:'dw',prioridade:'baixa',status:'done'},
    {titulo:'Cobrancas — 3 clientes atrasados',empresa_id:'of',prioridade:'alta',status:'todo'},
    {titulo:'Reuniao equipe — corte de custos',empresa_id:'of',prioridade:'alta',status:'todo'},
    {titulo:'Calendario de ensaios Q2',empresa_id:'of',prioridade:'media',status:'todo'},
    {titulo:'Revisao contrato fornecedor',empresa_id:'of',prioridade:'media',status:'done'},
    {titulo:'Fechar UNIFENAS — Medicina 2026',empresa_id:'fs',prioridade:'alta',status:'todo'},
    {titulo:'Proposta para UNIFAL',empresa_id:'fs',prioridade:'alta',status:'todo'},
    {titulo:'Configurar agente IA WhatsApp',empresa_id:'fs',prioridade:'media',status:'todo'},
    {titulo:'Planilha fundos ativos',empresa_id:'fs',prioridade:'media',status:'done'},
    {titulo:'Reuniao Hub CDL com Sebrae',empresa_id:'cdl',prioridade:'alta',status:'todo'},
    {titulo:'Aprovacao pauta assembleia Abril',empresa_id:'cdl',prioridade:'alta',status:'todo'},
    {titulo:'Relatorio mensal para diretoria',empresa_id:'cdl',prioridade:'media',status:'done'},
    {titulo:'Captacao novos associados',empresa_id:'cdl',prioridade:'baixa',status:'todo'},
    {titulo:'Declaracao IRPF 2026',empresa_id:'gp',prioridade:'alta',status:'todo'},
    {titulo:'Revisar carteira de investimentos',empresa_id:'gp',prioridade:'media',status:'todo'},
    {titulo:'Renovar seguro de vida',empresa_id:'gp',prioridade:'media',status:'todo'},
    {titulo:'Planejamento viagem familia',empresa_id:'gp',prioridade:'baixa',status:'todo'},
  ]
  const { error: tErr } = await supabase.from('tarefas').insert(tarefas)
  if (tErr) console.log('Erro tarefas:', tErr.message); else console.log('✅ 20 tarefas inseridas')

  console.log('6. Inserindo contratos...')
  const contratos = [
    {empresa_id:'dw',nome:'Contrato Padrao Medicos',valor:'R$ 890/mes',status:'ativo',vencimento:'Dez/2026'},
    {empresa_id:'dw',nome:'Plano Elite — Dr. Carvalho',valor:'R$ 2.400/mes',status:'ativo',vencimento:'Jun/2026'},
    {empresa_id:'of',nome:'Parceria Evento Casa Casada',valor:'R$ 3.500/evento',status:'ativo',vencimento:'Dez/2026'},
    {empresa_id:'of',nome:'Cliente Corporativo XYZ',valor:'R$ 1.800/mes',status:'inadim',vencimento:'Mai/2026'},
    {empresa_id:'fs',nome:'Fundo UNIFENAS Med 2026',valor:'R$ 5.000/mes',status:'ativo',vencimento:'Dez/2026'},
    {empresa_id:'fs',nome:'Fundo UNILAVRAS Med 2025',valor:'R$ 6.200/mes',status:'ativo',vencimento:'Jun/2025'},
    {empresa_id:'cdl',nome:'Parceria Sebrae — Hub Inovacao',valor:'Institucional',status:'negoc',vencimento:'Abr/2026'},
    {empresa_id:'cdl',nome:'Contrato Feira do Empreendedor',valor:'R$ 8.000',status:'ativo',vencimento:'Mai/2026'},
    {empresa_id:'gp',nome:'Financiamento Imovel — CEF',valor:'R$ 2.100/mes',status:'ativo',vencimento:'Dez/2031'},
    {empresa_id:'gp',nome:'Previdencia Privada PGBL',valor:'R$ 1.500/mes',status:'ativo',vencimento:'Vitalicio'},
  ]
  const { error: cErr } = await supabase.from('contratos').insert(contratos)
  if (cErr) console.log('Erro contratos:', cErr.message); else console.log('✅ 10 contratos inseridos')

  console.log('7. Inserindo riscos...')
  const riscos = [
    {empresa_id:'dw',descricao:'Entrada de concorrente especializado no nicho medico',nivel:'alto'},
    {empresa_id:'dw',descricao:'Regulacao CFC sobre contadores especializados',nivel:'medio'},
    {empresa_id:'of',descricao:'Sazonalidade — queda Q1 e Q3 todo ano',nivel:'alto'},
    {empresa_id:'of',descricao:'Equipamento principal precisa revisao urgente',nivel:'medio'},
    {empresa_id:'fs',descricao:'Concorrencia de bancos tradicionais nos fundos',nivel:'medio'},
    {empresa_id:'fs',descricao:'Dependencia total de captacao via indicacao',nivel:'alto'},
    {empresa_id:'cdl',descricao:'Queda no varejo regional impacta associacoes',nivel:'medio'},
    {empresa_id:'cdl',descricao:'Renovacao de diretoria Nov/2026',nivel:'baixo'},
    {empresa_id:'gp',descricao:'Concentracao de renda em empresas proprias',nivel:'alto'},
    {empresa_id:'gp',descricao:'Falta de diversificacao internacional',nivel:'medio'},
  ]
  const { error: rErr } = await supabase.from('riscos').insert(riscos)
  if (rErr) console.log('Erro riscos:', rErr.message); else console.log('✅ 10 riscos inseridos')

  console.log('8. Inserindo decisoes...')
  const decisoes = [
    {empresa_id:'dw',descricao:'Lancar vertical de planejamento patrimonial',data:'Mar/2026'},
    {empresa_id:'dw',descricao:'Contratar 2o contador senior',data:'Abr/2026'},
    {empresa_id:'of',descricao:'Reestruturacao completa de precificacao',data:'Mar/2026'},
    {empresa_id:'of',descricao:'Definir nicho: corporativo vs social',data:'Abr/2026'},
    {empresa_id:'fs',descricao:'Contratar comercial dedicado para novas turmas',data:'Abr/2026'},
    {empresa_id:'fs',descricao:'Criar landing page Forme Seguro',data:'Mar/2026'},
    {empresa_id:'cdl',descricao:'Aprovar projeto Hub CDL',data:'Abr/2026'},
    {empresa_id:'cdl',descricao:'Parceria SENAC para cursos',data:'Mar/2026'},
    {empresa_id:'gp',descricao:'Aportar em FII — MXRF11',data:'Mar/2026'},
    {empresa_id:'gp',descricao:'Contratar assessor de investimentos',data:'Abr/2026'},
  ]
  const { error: dErr } = await supabase.from('decisoes').insert(decisoes)
  if (dErr) console.log('Erro decisoes:', dErr.message); else console.log('✅ 10 decisoes inseridas')

  console.log('9. Inserindo CRM leads...')
  const crm = [
    {empresa_id:'dw',fase:'Lead',nome:'Dr. Bruno Alves',valor:'R$ 1.200/mes'},
    {empresa_id:'dw',fase:'Lead',nome:'Clinica Santa Clara',valor:'R$ 3.500/mes'},
    {empresa_id:'dw',fase:'Proposta',nome:'Dr. Renata Souza',valor:'R$ 890/mes'},
    {empresa_id:'dw',fase:'Negociacao',nome:'Dr. Marcos Vinicius',valor:'R$ 2.100/mes'},
    {empresa_id:'dw',fase:'Fechado',nome:'Dr. Felipe Costa',valor:'R$ 890/mes'},
    {empresa_id:'of',fase:'Lead',nome:'Turma Direito UFMG 2027',valor:'Projeto 3 anos'},
    {empresa_id:'of',fase:'Lead',nome:'Evento Empresa XYZ',valor:'R$ 4.500'},
    {empresa_id:'of',fase:'Proposta',nome:'Formatura Medicina BH',valor:'Projeto 4 anos'},
    {empresa_id:'of',fase:'Fechado',nome:'Casamento Silva',valor:'R$ 8.000'},
    {empresa_id:'fs',fase:'Lead',nome:'UNIFAL Medicina 2027',valor:'Projeto 5 anos'},
    {empresa_id:'fs',fase:'Lead',nome:'UFLA Medicina 2026',valor:'Projeto 4 anos'},
    {empresa_id:'fs',fase:'Proposta',nome:'UNIFENAS Odonto 2026',valor:'Projeto 3 anos'},
    {empresa_id:'fs',fase:'Negociacao',nome:'UNIMONTES Med 2026',valor:'Projeto 4 anos'},
    {empresa_id:'fs',fase:'Fechado',nome:'UNIFENAS Med 2026',valor:'R$ 5.000/mes'},
    {empresa_id:'cdl',fase:'Lead',nome:'Grupo Supermercados BH',valor:'Novo associado'},
    {empresa_id:'cdl',fase:'Lead',nome:'Rede Farmacias Local',valor:'Novo associado'},
    {empresa_id:'cdl',fase:'Negociacao',nome:'Franquia Fast Food',valor:'R$ 280/mes'},
    {empresa_id:'cdl',fase:'Fechado',nome:'Loja Roupas Centro',valor:'R$ 185/mes'},
  ]
  const { error: crmErr } = await supabase.from('crm_leads').insert(crm)
  if (crmErr) console.log('Erro CRM:', crmErr.message); else console.log('✅ 18 CRM leads inseridos')

  console.log('\n=== SETUP COMPLETO ===')
  console.log('108 registros inseridos em 9 tabelas')
  console.log('Acesse: https://orion-platform-wine.vercel.app\n')
}

checkAndSeed().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
