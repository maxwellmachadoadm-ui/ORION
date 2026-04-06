import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars'); process.exit(1) }
const sb = createClient(url, key, {auth:{autoRefreshToken:false,persistSession:false}})

console.log('=== ORION — Populando dados ===\n')

const kpis = [
  {empresa_id:'dw',icone:'👥',label:'Clientes Ativos',valor:'47 / 60',ordem:1},{empresa_id:'dw',icone:'🔄',label:'Receita Recorrente',valor:'R$ 38k/mes',ordem:2},{empresa_id:'dw',icone:'⚠',label:'Inadimplencia',valor:'3,2%',ordem:3},{empresa_id:'dw',icone:'🎯',label:'Ticket Medio',valor:'R$ 1.031',ordem:4},
  {empresa_id:'of',icone:'👥',label:'Clientes Ativos',valor:'22 / 30',ordem:1},{empresa_id:'of',icone:'📊',label:'Margem Liquida',valor:'15%',ordem:2},{empresa_id:'of',icone:'🚨',label:'Inadimplencia',valor:'8,7%',ordem:3},{empresa_id:'of',icone:'🏢',label:'Custo Fixo',valor:'R$ 18,5k/mes',ordem:4},
  {empresa_id:'fs',icone:'🎓',label:'Fundos Gerenciados',valor:'3 turmas',ordem:1},{empresa_id:'fs',icone:'💰',label:'Capital Gerenciado',valor:'R$ 420k',ordem:2},{empresa_id:'fs',icone:'✅',label:'Inadimplencia',valor:'0%',ordem:3},{empresa_id:'fs',icone:'🚀',label:'Pipeline',valor:'5 turmas',ordem:4},
  {empresa_id:'cdl',icone:'🏪',label:'Associados',valor:'1.100',ordem:1},{empresa_id:'cdl',icone:'💼',label:'Receita Associativa',valor:'R$ 30k/mes',ordem:2},{empresa_id:'cdl',icone:'✅',label:'Taxa Adimplencia',valor:'97,9%',ordem:3},{empresa_id:'cdl',icone:'📅',label:'Eventos no Ano',valor:'12',ordem:4},
  {empresa_id:'gp',icone:'🏦',label:'Patrimonio Estimado',valor:'R$ 1,2M',ordem:1},{empresa_id:'gp',icone:'💰',label:'Renda Total',valor:'R$ 52k/mes',ordem:2},{empresa_id:'gp',icone:'📈',label:'Investimentos',valor:'R$ 380k',ordem:3},{empresa_id:'gp',icone:'🎯',label:'Taxa de Poupanca',valor:'42%',ordem:4},
]
const r1 = await sb.from('kpis').insert(kpis)
console.log('KPIs:', r1.error ? 'ERRO: '+r1.error.message : '20 inseridos')

const okrs = [
  {empresa_id:'dw',objetivo:'Atingir 60 clientes medicos',progresso:78},{empresa_id:'dw',objetivo:'Reduzir inadimplencia para 2%',progresso:45},{empresa_id:'dw',objetivo:'Lancar DW Academy',progresso:30},
  {empresa_id:'of',objetivo:'Reduzir inadimplencia para 4%',progresso:35},{empresa_id:'of',objetivo:'Atingir 30 clientes ativos',progresso:73},{empresa_id:'of',objetivo:'Lancar pacote corporativo',progresso:20},
  {empresa_id:'fs',objetivo:'Fechar 12 contratos em 2026',progresso:25},{empresa_id:'fs',objetivo:'Atingir R$ 2M gerenciados',progresso:21},{empresa_id:'fs',objetivo:'Lancar app Forme Digital',progresso:10},
  {empresa_id:'cdl',objetivo:'Atingir 1.200 associados',progresso:92},{empresa_id:'cdl',objetivo:'Lancar Hub CDL + Sebrae',progresso:60},{empresa_id:'cdl',objetivo:'Digitalizar 80% dos processos',progresso:40},
  {empresa_id:'gp',objetivo:'Atingir R$ 1,5M patrimonio',progresso:80},{empresa_id:'gp',objetivo:'Investir R$ 10k/mes',progresso:65},{empresa_id:'gp',objetivo:'Quitar financiamento imovel',progresso:45},
]
const r2 = await sb.from('okrs').insert(okrs)
console.log('OKRs:', r2.error ? 'ERRO: '+r2.error.message : '15 inseridos')

const contratos = [
  {empresa_id:'dw',nome:'Contrato Padrao Medicos',valor:'R$ 890/mes',status:'ativo',vencimento:'Dez/2026'},
  {empresa_id:'dw',nome:'Plano Elite Dr. Carvalho',valor:'R$ 2.400/mes',status:'ativo',vencimento:'Jun/2026'},
  {empresa_id:'of',nome:'Parceria Evento Casa Casada',valor:'R$ 3.500/evento',status:'ativo',vencimento:'Dez/2026'},
  {empresa_id:'of',nome:'Cliente Corporativo XYZ',valor:'R$ 1.800/mes',status:'inadim',vencimento:'Mai/2026'},
  {empresa_id:'fs',nome:'Fundo UNIFENAS Med 2026',valor:'R$ 5.000/mes',status:'ativo',vencimento:'Dez/2026'},
  {empresa_id:'fs',nome:'Fundo UNILAVRAS Med 2025',valor:'R$ 6.200/mes',status:'ativo',vencimento:'Jun/2025'},
  {empresa_id:'cdl',nome:'Parceria Sebrae Hub Inovacao',valor:'Institucional',status:'negoc',vencimento:'Abr/2026'},
  {empresa_id:'cdl',nome:'Contrato Feira do Empreendedor',valor:'R$ 8.000',status:'ativo',vencimento:'Mai/2026'},
  {empresa_id:'gp',nome:'Financiamento Imovel CEF',valor:'R$ 2.100/mes',status:'ativo',vencimento:'Dez/2031'},
  {empresa_id:'gp',nome:'Previdencia Privada PGBL',valor:'R$ 1.500/mes',status:'ativo',vencimento:'Vitalicio'},
]
const r3 = await sb.from('contratos').insert(contratos)
console.log('Contratos:', r3.error ? 'ERRO: '+r3.error.message : '10 inseridos')

const riscos = [
  {empresa_id:'dw',descricao:'Entrada de concorrente especializado no nicho medico',nivel:'alto'},
  {empresa_id:'dw',descricao:'Regulacao CFC sobre contadores especializados',nivel:'medio'},
  {empresa_id:'of',descricao:'Sazonalidade queda Q1 e Q3 todo ano',nivel:'alto'},
  {empresa_id:'of',descricao:'Equipamento principal precisa revisao urgente',nivel:'medio'},
  {empresa_id:'fs',descricao:'Concorrencia de bancos tradicionais nos fundos',nivel:'medio'},
  {empresa_id:'fs',descricao:'Dependencia total de captacao via indicacao',nivel:'alto'},
  {empresa_id:'cdl',descricao:'Queda no varejo regional impacta associacoes',nivel:'medio'},
  {empresa_id:'cdl',descricao:'Renovacao de diretoria Nov/2026',nivel:'baixo'},
  {empresa_id:'gp',descricao:'Concentracao de renda em empresas proprias',nivel:'alto'},
  {empresa_id:'gp',descricao:'Falta de diversificacao internacional',nivel:'medio'},
]
const r4 = await sb.from('riscos').insert(riscos)
console.log('Riscos:', r4.error ? 'ERRO: '+r4.error.message : '10 inseridos')

const decisoes = [
  {empresa_id:'dw',descricao:'Lancar vertical de planejamento patrimonial',data:'Mar/2026'},
  {empresa_id:'dw',descricao:'Contratar 2o contador senior',data:'Abr/2026'},
  {empresa_id:'of',descricao:'Reestruturacao completa de precificacao',data:'Mar/2026'},
  {empresa_id:'of',descricao:'Definir nicho: corporativo vs social',data:'Abr/2026'},
  {empresa_id:'fs',descricao:'Contratar comercial dedicado para novas turmas',data:'Abr/2026'},
  {empresa_id:'fs',descricao:'Criar landing page Forme Seguro',data:'Mar/2026'},
  {empresa_id:'cdl',descricao:'Aprovar projeto Hub CDL',data:'Abr/2026'},
  {empresa_id:'cdl',descricao:'Parceria SENAC para cursos',data:'Mar/2026'},
  {empresa_id:'gp',descricao:'Aportar em FII MXRF11',data:'Mar/2026'},
  {empresa_id:'gp',descricao:'Contratar assessor de investimentos',data:'Abr/2026'},
]
const r5 = await sb.from('decisoes').insert(decisoes)
console.log('Decisoes:', r5.error ? 'ERRO: '+r5.error.message : '10 inseridos')

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
const r6 = await sb.from('crm_leads').insert(crm)
console.log('CRM Leads:', r6.error ? 'ERRO: '+r6.error.message : '18 inseridos')

// Check tarefas completude
const {data:existing} = await sb.from('tarefas').select('titulo')
const titles = new Set(existing?.map(t=>t.titulo)||[])
const allTarefas = [
  {titulo:'Pitch para 3 clinicas BH',empresa_id:'dw',prioridade:'alta',status:'todo'},
  {titulo:'Onboarding Dr. Felipe e Dra. Ana',empresa_id:'dw',prioridade:'alta',status:'todo'},
  {titulo:'Proposta Dr. Marcos Vinicius',empresa_id:'dw',prioridade:'media',status:'todo'},
  {titulo:'Calendario Instagram Abril',empresa_id:'dw',prioridade:'baixa',status:'done'},
  {titulo:'Cobrancas 3 clientes atrasados',empresa_id:'of',prioridade:'alta',status:'todo'},
  {titulo:'Reuniao equipe corte de custos',empresa_id:'of',prioridade:'alta',status:'todo'},
  {titulo:'Calendario de ensaios Q2',empresa_id:'of',prioridade:'media',status:'todo'},
  {titulo:'Revisao contrato fornecedor',empresa_id:'of',prioridade:'media',status:'done'},
  {titulo:'Fechar UNIFENAS Medicina 2026',empresa_id:'fs',prioridade:'alta',status:'todo'},
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
const missing = allTarefas.filter(t => !titles.has(t.titulo))
if(missing.length > 0) {
  const r7 = await sb.from('tarefas').insert(missing)
  console.log('Tarefas extras:', r7.error ? 'ERRO: '+r7.error.message : missing.length+' inseridas')
} else {
  console.log('Tarefas: 20 completas')
}

// Final count
console.log('\n=== TOTAIS ===')
for (const t of ['empresas','kpis','okrs','tarefas','contratos','riscos','decisoes','crm_leads']) {
  const {data} = await sb.from(t).select('id')
  console.log(t + ': ' + (data?.length || 0))
}
console.log('\nSeed completo!')
