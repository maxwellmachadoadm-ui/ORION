import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DEMO_DATA } from '../lib/demoData'

// ── BANCO DE CLASSIFICAÇÕES ──
export const CLASSIFICATION_BANK = {
  RECEITAS:   ['Honorários / Mensalidades', 'Serviços Avulsos', 'Eventos', 'Outros'],
  PESSOAL:    ['Salários', 'Pró-labore', 'Comissões', 'Encargos'],
  ESCRITÓRIO: ['Aluguel', 'Internet / Telefone', 'Material de Consumo', 'Material de Limpeza'],
  MARKETING:  ['Redes Sociais', 'Publicidade', 'Materiais Gráficos'],
  IMPOSTOS:   ['Simples Nacional', 'ISS', 'Outros Tributos'],
  FINANCEIRO: ['Tarifas Bancárias', 'Juros', 'Parcelamentos'],
  OUTROS:     ['Despesas Diversas'],
}

export const REVENUE_ORIGINS = ['PIX', 'Boleto', 'Cartão', 'Transferência', 'Dinheiro']
export const BANKS = ['Nubank', 'C6 Bank', 'Caixa Econômica', 'Itaú', 'Bradesco', 'Santander', 'BTG Pactual', 'Inter', 'Outro']

// ── BIBLIOTECA DEMO ──
const DEMO_BIBLIOTECA = [
  { id:'b1', empresa_id:'dw', nome:'Contrato Social DW.pdf', tipo:'application/pdf', tamanho:245000, url:'#', uploaded_by:'admin', uploaded_name:'Maxwell', created_at:'2026-03-01T09:00:00Z', descricao:'Contrato social atualizado 2026' },
  { id:'b2', empresa_id:'of', nome:'Tabela de Preços 2026.pdf', tipo:'application/pdf', tamanho:180000, url:'#', uploaded_by:'admin', uploaded_name:'Maxwell', created_at:'2026-03-05T09:00:00Z', descricao:'Tabela oficial de preços Q1 2026' },
  { id:'b3', empresa_id:'cdl', nome:'Ata Assembleia Mar26.pdf', tipo:'application/pdf', tamanho:320000, url:'#', uploaded_by:'admin', uploaded_name:'Maxwell', created_at:'2026-03-15T09:00:00Z', descricao:'Ata da assembleia geral ordinária' },
]

// ── COMPROMISSOS DEMO ──
const DEMO_COMPROMISSOS = [
  { id:'c1', empresa_id:'dw', nome:'Aluguel Escritório Matriz', descricao:'Sala 501, Ed. Corporate', valor:3500, vencimento:'2026-04-01', frequencia:'mensal', tipo:'recorrente', categoria:'ESCRITÓRIO', banco:'Caixa Econômica', status:'a_vencer', pago_em:null, created_by:'admin', created_at:'2026-01-01T09:00:00Z' },
  { id:'c2', empresa_id:'dw', nome:'DAS Simples Nacional', descricao:'Apuração mensal', valor:4200, vencimento:'2026-04-20', frequencia:'mensal', tipo:'recorrente', categoria:'IMPOSTOS', banco:'Nubank', status:'a_vencer', pago_em:null, created_by:'admin', created_at:'2026-01-01T09:00:00Z' },
  { id:'c3', empresa_id:'of', nome:'Adobe Creative Cloud', descricao:'Plano equipe 3 usuários', valor:890, vencimento:'2026-04-07', frequencia:'mensal', tipo:'recorrente', categoria:'ESCRITÓRIO', banco:'Nubank', status:'vencendo', pago_em:null, created_by:'admin', created_at:'2026-01-01T09:00:00Z' },
  { id:'c4', empresa_id:'cdl', nome:'Manutenção predial', descricao:'Contrato manutenção preventiva', valor:2200, vencimento:'2026-03-15', frequencia:'mensal', tipo:'recorrente', categoria:'ESCRITÓRIO', banco:'Caixa Econômica', status:'atrasado', pago_em:null, created_by:'admin', created_at:'2026-01-01T09:00:00Z' },
  { id:'c5', empresa_id:'dw', nome:'Servidor Cloud ORION', descricao:'Vercel Pro + Supabase', valor:390, vencimento:'2026-04-10', frequencia:'mensal', tipo:'recorrente', categoria:'ESCRITÓRIO', banco:'Nubank', status:'a_vencer', pago_em:null, created_by:'admin', created_at:'2026-01-01T09:00:00Z' },
]

// ── MÓDULOS PADRÃO ──
export const DEFAULT_MODULOS = ['KPIs', 'OKRs', 'Tarefas', 'Contratos', 'Riscos', 'Decisões', 'CRM', 'Pipeline', 'Fluxo de Caixa', 'DRE', 'Arquivos', 'Biblioteca', 'Gestão de Fundos', 'Projeções', 'Projetos', 'Patrimônio']

// ── LANÇAMENTOS DEMO ──
const DEMO_LANCAMENTOS_V4 = [
  { id:'l01', empresa_id:'dw', tipo:'receita',  categoria:'RECEITAS',   subcategoria:'Honorários / Mensalidades', banco:'Nubank',         origem:'PIX',           valor:38000, mes:'2026-03', descricao:'Mensalidades médicos março',       data:'2026-03-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-05T09:00:00Z' },
  { id:'l02', empresa_id:'dw', tipo:'despesa',  categoria:'PESSOAL',    subcategoria:'Salários',                  banco:'C6 Bank',         origem:null,            valor:12000, mes:'2026-03', descricao:'Salário equipe DW',               data:'2026-03-05', status:'aprovado', anexo_nome:'folha_mar26.pdf', criado_por:'admin', criado_em:'2026-03-05T10:00:00Z' },
  { id:'l03', empresa_id:'dw', tipo:'despesa',  categoria:'IMPOSTOS',   subcategoria:'Simples Nacional',          banco:'Nubank',         origem:null,            valor:4200,  mes:'2026-03', descricao:'DAS Simples Nacional',             data:'2026-03-20', status:'aprovado', anexo_nome:'das_mar.pdf', criado_por:'admin', criado_em:'2026-03-20T08:00:00Z' },
  { id:'l04', empresa_id:'dw', tipo:'despesa',  categoria:'ESCRITÓRIO', subcategoria:'Internet / Telefone',       banco:'Nubank',         origem:null,            valor:890,   mes:'2026-03', descricao:'Servidor cloud ORION',             data:'2026-03-10', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-10T08:00:00Z' },
  { id:'l05', empresa_id:'dw', tipo:'despesa',  categoria:'ESCRITÓRIO', subcategoria:'Aluguel',                   banco:'Caixa Econômica', origem:null,            valor:3500,  mes:'2026-03', descricao:'Aluguel escritório matriz',        data:'2026-03-01', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-01T07:00:00Z' },
  { id:'l06', empresa_id:'of', tipo:'receita',  categoria:'RECEITAS',   subcategoria:'Serviços Avulsos',          banco:'C6 Bank',         origem:'Boleto',        valor:28000, mes:'2026-03', descricao:'Ensaios e eventos março',          data:'2026-03-08', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-08T09:00:00Z' },
  { id:'l07', empresa_id:'of', tipo:'despesa',  categoria:'PESSOAL',    subcategoria:'Salários',                  banco:'C6 Bank',         origem:null,            valor:7500,  mes:'2026-03', descricao:'Salário equipe OF',               data:'2026-03-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-05T09:30:00Z' },
  { id:'l08', empresa_id:'of', tipo:'despesa',  categoria:'MARKETING',  subcategoria:'Redes Sociais',             banco:'Nubank',         origem:null,            valor:1200,  mes:'2026-03', descricao:'Campanha Instagram OF',            data:'2026-03-12', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-12T11:00:00Z' },
  { id:'l09', empresa_id:'fs', tipo:'receita',  categoria:'RECEITAS',   subcategoria:'Honorários / Mensalidades', banco:'BTG Pactual',     origem:'Transferência', valor:15000, mes:'2026-03', descricao:'Gestão fundos março',              data:'2026-03-03', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-03T09:00:00Z' },
  { id:'l10', empresa_id:'fs', tipo:'despesa',  categoria:'MARKETING',  subcategoria:'Publicidade',               banco:'Nubank',         origem:null,            valor:1200,  mes:'2026-03', descricao:'Campanha captação turmas',         data:'2026-03-15', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-15T10:00:00Z' },
  { id:'l11', empresa_id:'cdl',tipo:'receita',  categoria:'RECEITAS',   subcategoria:'Honorários / Mensalidades', banco:'Caixa Econômica', origem:'Boleto',        valor:35000, mes:'2026-03', descricao:'Associatividade CDL março',        data:'2026-03-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-05T08:00:00Z' },
  { id:'l12', empresa_id:'cdl',tipo:'despesa',  categoria:'PESSOAL',    subcategoria:'Salários',                  banco:'Caixa Econômica', origem:null,            valor:9000,  mes:'2026-03', descricao:'Folha de pagamento CDL',          data:'2026-03-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-03-05T09:00:00Z' },
  { id:'l13', empresa_id:'dw', tipo:'receita',  categoria:'RECEITAS',   subcategoria:'Honorários / Mensalidades', banco:'Nubank',         origem:'PIX',           valor:36000, mes:'2026-02', descricao:'Mensalidades médicos fevereiro',  data:'2026-02-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-02-05T09:00:00Z' },
  { id:'l14', empresa_id:'dw', tipo:'despesa',  categoria:'PESSOAL',    subcategoria:'Salários',                  banco:'C6 Bank',         origem:null,            valor:12000, mes:'2026-02', descricao:'Salário equipe DW fev',           data:'2026-02-05', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-02-05T10:00:00Z' },
  { id:'l15', empresa_id:'dw', tipo:'despesa',  categoria:'IMPOSTOS',   subcategoria:'Simples Nacional',          banco:'Nubank',         origem:null,            valor:4100,  mes:'2026-02', descricao:'DAS Simples Nacional fev',        data:'2026-02-20', status:'aprovado', anexo_nome:null, criado_por:'admin', criado_em:'2026-02-20T08:00:00Z' },
]

// ── UTILITÁRIO: valor seguro — retorna '—' se NaN/undefined/Infinity ──
export function safeVal(val, decimals = 1, suffix = '%') {
  if (val == null || isNaN(val) || !isFinite(val)) return '—'
  return Number(val).toFixed(decimals) + suffix
}

// ── CALCULATE HEALTH SCORE ──
export function calculateHealthScore(emp, lancamentos = []) {
  if (!emp) return 50
  let score = 50 // base

  // Margem líquida (peso 25): ideal > 20%
  const margem = emp.faturamento > 0 && emp.resultado != null
    ? (emp.resultado / emp.faturamento) * 100 : null
  if (margem != null && isFinite(margem)) {
    if (margem >= 20) score += 25
    else if (margem >= 10) score += 15
    else if (margem >= 0) score += 5
    else score -= 15
  }

  // % meta atingida (peso 20): ideal > 80%
  const pctMeta = emp.meta > 0 ? (emp.faturamento / emp.meta) * 100 : 75
  if (pctMeta >= 80) score += 20
  else if (pctMeta >= 60) score += 10
  else if (pctMeta >= 40) score += 0
  else score -= 10

  // Crescimento (peso 15): ideal > 10%
  const cresc = emp.crescimento != null && isFinite(emp.crescimento) ? emp.crescimento : 0
  if (cresc >= 10) score += 15
  else if (cresc >= 0) score += 8
  else if (cresc >= -10) score -= 5
  else score -= 15

  // Inadimplência (peso 10): ideal < 2%
  const inad = emp.inadimplencia != null && isFinite(emp.inadimplencia) ? emp.inadimplencia : null
  if (inad != null) {
    if (inad <= 2) score += 10
    else if (inad <= 5) score += 5
    else if (inad <= 10) score -= 5
    else score -= 10
  }

  const result = Math.max(10, Math.min(100, Math.round(score)))
  return isNaN(result) ? (emp.score || 50) : result
}

// ── DEMO AGENDA ──
const DEMO_AGENDA = [
  { id: '1', titulo: 'Reunião CDL — Assembleia', data: '2026-04-08', hora: '09:00', tipo: 'reuniao', empresa: 'cdl' },
  { id: '2', titulo: 'Consultoria Doctor Wealth', data: '2026-04-09', hora: '14:00', tipo: 'consultoria', empresa: 'dw' },
  { id: '3', titulo: 'Reunião com investidor FS', data: '2026-04-10', hora: '10:30', tipo: 'reuniao', empresa: 'fs' },
  { id: '4', titulo: 'Revisão financeira mensal', data: '2026-04-14', hora: '08:00', tipo: 'financeiro', empresa: null },
]

// ── SANITIZAR CDL — GARANTIA ABSOLUTA ──
export function safeName(name) {
  if (!name || typeof name !== 'string') return name
  return name.replace(/CDL\s*Divin[oó]polis/gi, 'CDL ITAPERUNA')
}

function sanitizeCDL(empresasList) {
  if (!Array.isArray(empresasList)) return empresasList
  return empresasList.map(e => {
    if (e.id === 'cdl' || (e.nome && /CDL/i.test(e.nome) && /Divin/i.test(e.nome))) {
      return { ...e, nome: 'CDL ITAPERUNA', descricao: 'Câmara de Dirigentes Lojistas Itaperuna' }
    }
    // Catch any string field that mentions CDL Divinopolis
    if (e.nome && /Divin[oó]polis/i.test(e.nome)) {
      return { ...e, nome: e.nome.replace(/Divin[oó]polis/gi, 'ITAPERUNA') }
    }
    return e
  })
}

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const { user, userCompanies, isAdmin } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [tarefas, setTarefas] = useState([])
  const [kpis, setKpis] = useState([])
  const [okrs, setOkrs] = useState([])
  const [contratos, setContratos] = useState([])
  const [riscos, setRiscos] = useState([])
  const [decisoes, setDecisoes] = useState([])
  const [crmLeads, setCrmLeads] = useState([])
  const [checkin, setCheckin] = useState({ prioridade: '', decisao: '', resultado: '' })
  const [loaded, setLoaded] = useState(false)

  // ── AGENDA ──
  const [agenda, setAgenda] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_agenda') || 'null') || DEMO_AGENDA } catch { return DEMO_AGENDA }
  })

  // ── LANÇAMENTOS FINANCEIROS ──
  const [lancamentos, setLancamentos] = useState(() => {
    try {
      const saved = localStorage.getItem('orion_lancamentos_v4')
      return saved ? JSON.parse(saved) : DEMO_LANCAMENTOS_V4
    } catch { return DEMO_LANCAMENTOS_V4 }
  })

  // ── FILA DE APROVAÇÃO ──
  const [pendingClassifications, setPendingClassifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_pending_class') || '[]') } catch { return [] }
  })

  // ── ARQUIVOS ──
  const [arquivos, setArquivos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_arquivos') || '[]') } catch { return [] }
  })

  // ── APRENDIZADO MAXXXI ──
  const [maxxxi_learned, setMaxxxiLearned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_maxxxi_learned') || '{}') } catch { return {} }
  })

  // ── BIBLIOTECA ──
  const [biblioteca, setBiblioteca] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_biblioteca') || 'null') || DEMO_BIBLIOTECA } catch { return DEMO_BIBLIOTECA }
  })

  // ── COMPROMISSOS ──
  const [compromissos, setCompromissos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_compromissos') || 'null') || DEMO_COMPROMISSOS } catch { return DEMO_COMPROMISSOS }
  })

  const loadAll = useCallback(async () => {
    if (!user) return
    if (isDemoMode) {
      // ── MIGRAÇÃO: corrige dados antigos de CDL no localStorage ──
      try {
        const customEmpsRaw = localStorage.getItem('orion_custom_empresas')
        if (customEmpsRaw) {
          const fixed = customEmpsRaw
            .replace(/CDL Divin[oó]polis/gi, 'CDL ITAPERUNA')
            .replace(/C[aâ]mara.*?Divin[oó]polis/gi, 'Câmara de Dirigentes Lojistas Itaperuna')
            .replace(/Divin[oó]polis.*?lojistas/gi, 'Itaperuna — lojistas')
          if (fixed !== customEmpsRaw) {
            localStorage.setItem('orion_custom_empresas', fixed)
            console.info('[ORION] Migração CDL: nome incorreto → "CDL ITAPERUNA" corrigido no localStorage.')
          }
        }
      } catch (_) {}

      // Carregar empresas base + customizadas, SEMPRE sanitizando CDL
      let baseEmps = [...DEMO_DATA.empresas]
      const customEmps = JSON.parse(localStorage.getItem('orion_custom_empresas') || '[]')
      if (customEmps.length > 0) {
        customEmps.forEach(c => {
          const idx = baseEmps.findIndex(e => e.id === c.id)
          if (idx >= 0) baseEmps[idx] = { ...baseEmps[idx], ...c }
          else baseEmps.push(c)
        })
      }
      // SANITIZAR CDL — nunca permitir "Divinopolis"
      baseEmps = sanitizeCDL(baseEmps)
      // Persistir correção no localStorage
      if (customEmps.length > 0) {
        const fixed = sanitizeCDL(customEmps)
        localStorage.setItem('orion_custom_empresas', JSON.stringify(fixed))
      }
      setEmpresas(baseEmps)
      setKpis(DEMO_DATA.kpis)
      setOkrs(DEMO_DATA.okrs)
      setContratos(DEMO_DATA.contratos)
      setRiscos(DEMO_DATA.riscos)
      setDecisoes(DEMO_DATA.decisoes)
      setCrmLeads(DEMO_DATA.crmLeads)
      const savedTasks = localStorage.getItem('orion_tasks_v2')
      setTarefas(savedTasks ? JSON.parse(savedTasks) : DEMO_DATA.tarefas)
      const savedCI = localStorage.getItem('orion_ci_' + new Date().toDateString())
      if (savedCI) setCheckin(JSON.parse(savedCI))
      setLoaded(true)
      return
    }
    const [e, t, k, o, c, r, d, crm] = await Promise.all([
      supabase.from('empresas').select('*'),
      supabase.from('tarefas').select('*').order('created_at', { ascending: false }),
      supabase.from('kpis').select('*').order('ordem'),
      supabase.from('okrs').select('*'),
      supabase.from('contratos').select('*'),
      supabase.from('riscos').select('*'),
      supabase.from('decisoes').select('*'),
      supabase.from('crm_leads').select('*')
    ])
    setEmpresas(sanitizeCDL(e.data || []))
    setTarefas(t.data || [])
    setKpis(k.data || [])
    setOkrs(o.data || [])
    setContratos(c.data || [])
    setRiscos(r.data || [])
    setDecisoes(d.data || [])
    setCrmLeads(crm.data || [])
    // Load today's checkin
    const { data: ci } = await supabase.from('checkins')
      .select('*').eq('user_id', user.id).eq('data', new Date().toISOString().slice(0, 10)).single()
    if (ci) setCheckin({ prioridade: ci.prioridade || '', decisao: ci.decisao || '', resultado: ci.resultado || '' })
    setLoaded(true)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  // Realtime subscriptions
  useEffect(() => {
    if (isDemoMode || !user) return
    const channel = supabase.channel('orion-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas' }, () => {
        supabase.from('tarefas').select('*').order('created_at', { ascending: false }).then(({ data }) => setTarefas(data || []))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => {
        supabase.from('empresas').select('*').then(({ data }) => setEmpresas(data || []))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  // ── TASK CRUD ──
  async function addTask(task) {
    if (isDemoMode) {
      const t = { ...task, id: Date.now().toString(), created_at: new Date().toISOString() }
      const next = [t, ...tarefas]
      setTarefas(next)
      localStorage.setItem('orion_tasks_v2', JSON.stringify(next))
      return t
    }
    const { data, error } = await supabase.from('tarefas').insert({ ...task, created_by: user.id }).select().single()
    if (error) throw error
    setTarefas(prev => [data, ...prev])
    return data
  }

  async function updateTask(id, updates) {
    if (isDemoMode) {
      const next = tarefas.map(t => t.id === id ? { ...t, ...updates } : t)
      setTarefas(next)
      localStorage.setItem('orion_tasks_v2', JSON.stringify(next))
      return
    }
    const { error } = await supabase.from('tarefas').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  async function deleteTask(id) {
    if (isDemoMode) {
      const next = tarefas.filter(t => t.id !== id)
      setTarefas(next)
      localStorage.setItem('orion_tasks_v2', JSON.stringify(next))
      return
    }
    await supabase.from('tarefas').delete().eq('id', id)
    setTarefas(prev => prev.filter(t => t.id !== id))
  }

  // ── CHECKIN ──
  async function saveCheckin(ci) {
    setCheckin(ci)
    if (isDemoMode) {
      localStorage.setItem('orion_ci_' + new Date().toDateString(), JSON.stringify(ci))
      return
    }
    await supabase.from('checkins').upsert({
      user_id: user.id,
      data: new Date().toISOString().slice(0, 10),
      ...ci
    })
  }

  // ── LANÇAMENTOS CRUD ──
  function addLancamento(lancamento) {
    const novo = { ...lancamento, id: Date.now().toString(), criado_em: new Date().toISOString() }
    const next = [novo, ...lancamentos]
    setLancamentos(next)
    localStorage.setItem('orion_lancamentos_v4', JSON.stringify(next))
  }

  function approveLancamento(id) {
    const next = lancamentos.map(l => l.id === id ? { ...l, status: 'aprovado' } : l)
    setLancamentos(next)
    localStorage.setItem('orion_lancamentos_v4', JSON.stringify(next))
    // Remove da fila de pendentes
    const pendNext = pendingClassifications.filter(p => p.lancamento_id !== id)
    setPendingClassifications(pendNext)
    localStorage.setItem('orion_pending_class', JSON.stringify(pendNext))
  }

  function deleteLancamento(id) {
    if (!isAdmin) return
    const next = lancamentos.filter(l => l.id !== id)
    setLancamentos(next)
    localStorage.setItem('orion_lancamentos_v4', JSON.stringify(next))
  }

  function updateLancamento(id, updates) {
    const next = lancamentos.map(l => l.id === id ? { ...l, ...updates } : l)
    setLancamentos(next)
    localStorage.setItem('orion_lancamentos_v4', JSON.stringify(next))
  }

  function getLancamentosByEmpresa(empresaId, mes) {
    return lancamentos.filter(l => {
      const empOk = !empresaId || empresaId === 'all' || l.empresa_id === empresaId
      const mesOk = !mes || l.mes === mes
      return empOk && mesOk
    })
  }

  function getResumoFinanceiro(empresaId) {
    const items = lancamentos.filter(l =>
      l.status === 'aprovado' &&
      (!empresaId || empresaId === 'all' || l.empresa_id === empresaId)
    )
    const receitas = items.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const despesas = items.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    const resultado = receitas - despesas
    const margem = receitas > 0 && isFinite(resultado / receitas) ? ((resultado / receitas) * 100).toFixed(1) + '%' : '—'

    const porCategoria = {}
    items.forEach(l => {
      if (!porCategoria[l.categoria]) porCategoria[l.categoria] = { receitas: 0, despesas: 0 }
      if (l.tipo === 'receita') porCategoria[l.categoria].receitas += l.valor
      else porCategoria[l.categoria].despesas += l.valor
    })

    const porBanco = {}
    items.forEach(l => {
      if (!l.banco) return
      if (!porBanco[l.banco]) porBanco[l.banco] = { entradas: 0, saidas: 0 }
      if (l.tipo === 'receita') porBanco[l.banco].entradas += l.valor
      else porBanco[l.banco].saidas += l.valor
    })

    return { receitas, despesas, resultado, margem, porCategoria, porBanco }
  }

  // ── ARQUIVOS CRUD ──
  function addArquivo(arquivo) {
    const novo = { ...arquivo, id: Date.now().toString(), data_upload: new Date().toISOString() }
    const next = [novo, ...arquivos]
    setArquivos(next)
    localStorage.setItem('orion_arquivos', JSON.stringify(next))
  }

  function deleteArquivo(id) {
    if (!isAdmin) return
    const next = arquivos.filter(a => a.id !== id)
    setArquivos(next)
    localStorage.setItem('orion_arquivos', JSON.stringify(next))
  }

  // ── APRENDIZADO MAXXXI ──
  function learnClassification(descricao, categoria, subcategoria) {
    const key = descricao.toLowerCase().trim()
    const next = {
      ...maxxxi_learned,
      [key]: { categoria, subcategoria, count: ((maxxxi_learned[key]?.count) || 0) + 1 }
    }
    setMaxxxiLearned(next)
    localStorage.setItem('orion_maxxxi_learned', JSON.stringify(next))
  }

  function suggestClassification(descricao) {
    const key = descricao.toLowerCase().trim()
    // Busca exata
    if (maxxxi_learned[key]) return { ...maxxxi_learned[key], confidence: 95 }
    // Busca parcial
    const keys = Object.keys(maxxxi_learned)
    for (const k of keys) {
      if (key.includes(k) || k.includes(key)) {
        return { ...maxxxi_learned[k], confidence: 70 }
      }
    }
    return null
  }

  // ── Empresas filtradas pelo acesso do usuário ──
  const empresasVisiveis = useMemo(() => {
    if (!userCompanies || userCompanies.length === 0) return empresas
    return empresas.filter(e => userCompanies.includes(e.id))
  }, [empresas, userCompanies])

  // ── HELPERS ──
  function getEmpresa(id) { return empresas.find(e => e.id === id) }
  function getKpis(empId) { return kpis.filter(k => k.empresa_id === empId) }
  function getOkrs(empId) { return okrs.filter(o => o.empresa_id === empId) }
  function getTarefas(empId) { return tarefas.filter(t => t.empresa_id === empId) }
  function getContratos(empId) { return contratos.filter(c => c.empresa_id === empId) }
  function getRiscos(empId) { return riscos.filter(r => r.empresa_id === empId) }
  function getDecisoes(empId) { return decisoes.filter(d => d.empresa_id === empId) }
  function getCrmLeads(empId) { return crmLeads.filter(l => l.empresa_id === empId) }

  const fmt = v => {
    if (!v && v !== 0) return '—'
    if (v === 0) return 'R$ 0'
    if (v >= 1000000) return 'R$ ' + (v / 1000000).toFixed(1) + 'M'
    if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(0) + 'k'
    return 'R$ ' + Number(v).toLocaleString('pt-BR')
  }

  // ── SCORE HISTORY ──
  function getScoreHistory(empresaId) {
    const saved = JSON.parse(localStorage.getItem(`orion_score_hist_${empresaId}`) || 'null')
    if (saved) return saved
    const emp = empresas.find(e => e.id === empresaId)
    if (!emp) return []
    const baseScore = emp.score || 50
    const months = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar']
    return months.map((m, i) => ({
      mes: m,
      score: Math.max(20, Math.min(100, baseScore - 15 + Math.round(Math.random() * 10) + i * 2))
    }))
  }

  // ── CASH FLOW ──
  function getCashFlow(empresaId, dias = 90) {
    const emp = empresas.find(e => e.id === empresaId)
    if (!emp) return { semanas: [], saldoAtual: 0, alertaNegativo: false }

    const lancEmp = lancamentos.filter(l => l.empresa_id === empresaId && l.status === 'aprovado')
    const receitaMes = lancEmp.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0) || emp.faturamento || 0
    const despesaMes = lancEmp.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0) || (receitaMes * 0.7)

    const semanas = Math.ceil(dias / 7)
    const receitaSemana = receitaMes / 4
    const despesaSemana = despesaMes / 4

    let saldo = receitaMes * 0.5
    const resultado = []
    let alertaNegativo = false

    for (let i = 0; i < semanas; i++) {
      const semLabel = `S${i + 1}`
      const varEntrada = 0.85 + (Math.sin(i * 1.3) * 0.2)
      const varSaida = 0.90 + (Math.cos(i * 1.1) * 0.15)
      const entrada = Math.round(receitaSemana * varEntrada)
      const saida = Math.round(despesaSemana * varSaida)
      saldo += entrada - saida
      if (saldo < 0) alertaNegativo = true
      resultado.push({ semana: semLabel, entrada, saida, saldo: Math.round(saldo) })
    }

    return { semanas: resultado.slice(0, semanas), saldoAtual: Math.round(receitaMes * 0.5), alertaNegativo }
  }

  // ── DRE ──
  function getDRE(empresaId, mes) {
    const itens = lancamentos.filter(l =>
      l.status === 'aprovado' &&
      (!empresaId || empresaId === 'all' || l.empresa_id === empresaId) &&
      (!mes || l.mes === mes)
    )

    const receitaBruta = itens.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const deducoes = itens.filter(l => l.tipo === 'despesa' && l.categoria === 'IMPOSTOS').reduce((s, l) => s + l.valor, 0)
    const receitaLiquida = receitaBruta - deducoes
    const custosDirectos = itens.filter(l => l.tipo === 'despesa' && l.categoria === 'PESSOAL').reduce((s, l) => s + l.valor, 0)
    const margemBruta = receitaLiquida - custosDirectos
    const despesasOp = itens.filter(l => l.tipo === 'despesa' && !['IMPOSTOS','PESSOAL'].includes(l.categoria)).reduce((s, l) => s + l.valor, 0)
    const ebitda = margemBruta - despesasOp
    const resultadoLiquido = ebitda

    const margemBrutaPct = receitaLiquida > 0 ? ((margemBruta / receitaLiquida) * 100).toFixed(1) : 0
    const margemLiquidaPct = receitaBruta > 0 ? ((resultadoLiquido / receitaBruta) * 100).toFixed(1) : 0

    return {
      receitaBruta, deducoes, receitaLiquida, custosDirectos, margemBruta,
      despesasOp, ebitda, resultadoLiquido, margemBrutaPct, margemLiquidaPct
    }
  }

  // ── PIPELINE ──
  function getPipeline(empresaId) {
    const contratoEmp = contratos.filter(c => c.empresa_id === empresaId && c.status === 'ativo')
    const leadsEmp = crmLeads.filter(l => l.empresa_id === empresaId)

    const garantida = contratoEmp.reduce((s, c) => {
      const val = parseFloat((c.valor || '0').replace(/[^\d.]/g, '')) || 0
      return s + val
    }, 0)

    const provavel = leadsEmp.filter(l => l.fase === 'Negociacao' || l.fase === 'Negociação').reduce((s, l) => {
      const val = parseFloat((l.valor_estimado || '5000').replace(/[^\d.]/g, '')) || 5000
      return s + val * 0.7
    }, 0)

    const possivel = leadsEmp.filter(l => l.fase === 'Proposta').reduce((s, l) => {
      const val = parseFloat((l.valor_estimado || '5000').replace(/[^\d.]/g, '')) || 5000
      return s + val * 0.4
    }, 0)

    const total = garantida + provavel + possivel

    const meses = [0, 1, 2].map(i => {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      return {
        mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        garantida: Math.round(garantida * (1 - i * 0.05)),
        provavel: Math.round(provavel * (1 + i * 0.1)),
        possivel: Math.round(possivel * (1 + i * 0.15)),
      }
    })

    return { garantida, provavel, possivel, total, meses }
  }

  // ── PATRIMÔNIO ──
  function getPatrimonio() {
    const saved = localStorage.getItem('orion_patrimonio')
    if (saved) return JSON.parse(saved)
    return {
      imoveis: 650000,
      investimentos: 380000,
      participacoes: 200000,
      veiculos: 85000,
      previdencia: 120000,
      dividas: 45000,
      historico: [
        { mes: 'Out/25', total: 1320000 },
        { mes: 'Nov/25', total: 1350000 },
        { mes: 'Dez/25', total: 1370000 },
        { mes: 'Jan/26', total: 1390000 },
        { mes: 'Fev/26', total: 1410000 },
        { mes: 'Mar/26', total: 1430000 },
      ]
    }
  }

  function savePatrimonio(data) {
    localStorage.setItem('orion_patrimonio', JSON.stringify(data))
  }

  // ── CRUD DE EMPRESAS ──
  async function addEmpresa(data) {
    const nova = {
      ...data,
      id: data.id || data.sigla.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
      score: data.score || 50,
      status: data.status || 'Novo',
      status_cor: data.status_cor || data.cor,
      faturamento: data.faturamento || 0,
      meta: data.meta || 0,
      resultado: data.resultado || 0,
      crescimento: data.crescimento || 0,
      drive_url: data.drive_url || 'https://drive.google.com',
      logo_url: data.logo_url || null,
      rgb: data.rgb || '59,130,246',
    }
    if (isDemoMode) {
      setEmpresas(prev => [...prev, nova])
      const custom = JSON.parse(localStorage.getItem('orion_custom_empresas') || '[]')
      custom.push(nova)
      localStorage.setItem('orion_custom_empresas', JSON.stringify(custom))
      return nova
    }
    const { data: d, error } = await supabase.from('empresas').insert(nova).select().single()
    if (error) throw error
    setEmpresas(prev => [...prev, d])
    return d
  }

  async function updateEmpresa(id, updates) {
    if (isDemoMode) {
      setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      const custom = JSON.parse(localStorage.getItem('orion_custom_empresas') || '[]')
      const idx = custom.findIndex(e => e.id === id)
      if (idx >= 0) { custom[idx] = { ...custom[idx], ...updates }; localStorage.setItem('orion_custom_empresas', JSON.stringify(custom)) }
      return
    }
    const { error } = await supabase.from('empresas').update(updates).eq('id', id)
    if (error) throw error
    setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  async function removeEmpresa(id) {
    if (isDemoMode) {
      setEmpresas(prev => prev.filter(e => e.id !== id))
      const custom = JSON.parse(localStorage.getItem('orion_custom_empresas') || '[]')
      localStorage.setItem('orion_custom_empresas', JSON.stringify(custom.filter(e => e.id !== id)))
      return
    }
    const { error } = await supabase.from('empresas').delete().eq('id', id)
    if (error) throw error
    setEmpresas(prev => prev.filter(e => e.id !== id))
  }

  async function uploadLogoEmpresa(empresaId, file) {
    if (isDemoMode) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async e => {
          const url = e.target.result
          await updateEmpresa(empresaId, { logo_url: url })
          resolve(url)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    const ext = file.name.split('.').pop()
    const path = `logos/${empresaId}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) {
      if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket') || upErr.statusCode === 400) {
        throw new Error('Bucket de armazenamento não configurado. Execute o script supabase/create_buckets.sql no painel do Supabase.')
      }
      throw upErr
    }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    await updateEmpresa(empresaId, { logo_url: publicUrl })
    return publicUrl
  }

  // ── BIBLIOTECA CRUD ──
  async function addBibliotecaItem(item) {
    const novo = { ...item, id: Date.now().toString(), created_at: new Date().toISOString() }
    if (isDemoMode) {
      const next = [novo, ...biblioteca]
      setBiblioteca(next)
      localStorage.setItem('orion_biblioteca', JSON.stringify(next))
      return novo
    }
    const { data, error } = await supabase.from('biblioteca').insert(novo).select().single()
    if (error) throw error
    setBiblioteca(prev => [data, ...prev])
    return data
  }

  async function deleteBibliotecaItem(id) {
    if (isDemoMode) {
      const next = biblioteca.filter(b => b.id !== id)
      setBiblioteca(next)
      localStorage.setItem('orion_biblioteca', JSON.stringify(next))
      return
    }
    await supabase.from('biblioteca').delete().eq('id', id)
    setBiblioteca(prev => prev.filter(b => b.id !== id))
  }

  function getBiblioteca(empresaId) {
    return biblioteca.filter(b => !empresaId || b.empresa_id === empresaId)
  }

  async function uploadBibliotecaFile(empresaId, file, descricao = '') {
    const nomeArq = file.name
    const tipo = file.type
    const tamanho = file.size
    const uploadedName = profile?.name || 'Admin'

    if (isDemoMode) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const url = ev.target.result
          const item = await addBibliotecaItem({ empresa_id: empresaId, nome: nomeArq, tipo, tamanho, url, uploaded_by: user?.id || 'demo', uploaded_name: uploadedName, descricao })
          resolve(item)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    const path = `biblioteca/${empresaId}/${Date.now()}_${nomeArq}`
    const { error: upErr } = await supabase.storage.from('biblioteca').upload(path, file, { upsert: false, contentType: tipo })
    if (upErr) {
      if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket') || upErr.statusCode === 400) {
        throw new Error('Bucket de armazenamento não configurado. Execute o script supabase/create_buckets.sql no painel do Supabase.')
      }
      throw upErr
    }
    const { data: { publicUrl } } = supabase.storage.from('biblioteca').getPublicUrl(path)
    return addBibliotecaItem({ empresa_id: empresaId, nome: nomeArq, tipo, tamanho, url: publicUrl, uploaded_by: user?.id, uploaded_name: uploadedName, descricao })
  }

  // ── COMPROMISSOS CRUD ──
  function getCompromissos(empresaId) {
    return compromissos.filter(c => !empresaId || empresaId === 'all' || c.empresa_id === empresaId)
  }

  function addCompromisso(data) {
    const novo = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() }
    const next = [novo, ...compromissos]
    setCompromissos(next)
    localStorage.setItem('orion_compromissos', JSON.stringify(next))
    return novo
  }

  function updateCompromisso(id, updates) {
    const next = compromissos.map(c => c.id === id ? { ...c, ...updates } : c)
    setCompromissos(next)
    localStorage.setItem('orion_compromissos', JSON.stringify(next))
  }

  function deleteCompromisso(id) {
    const next = compromissos.filter(c => c.id !== id)
    setCompromissos(next)
    localStorage.setItem('orion_compromissos', JSON.stringify(next))
  }

  function marcarPago(id) {
    const comp = compromissos.find(c => c.id === id)
    if (!comp) return
    let nextVenc = comp.vencimento
    if (comp.tipo === 'recorrente') {
      const d = new Date(comp.vencimento)
      if (comp.frequencia === 'mensal') d.setMonth(d.getMonth() + 1)
      else if (comp.frequencia === 'anual') d.setFullYear(d.getFullYear() + 1)
      else if (comp.frequencia === 'semanal') d.setDate(d.getDate() + 7)
      else if (comp.frequencia === 'diario') d.setDate(d.getDate() + 1)
      nextVenc = d.toISOString().slice(0, 10)
    }
    const next = compromissos.map(c => c.id === id
      ? { ...c, status: 'pago', pago_em: new Date().toISOString(), vencimento: comp.tipo === 'recorrente' ? nextVenc : c.vencimento }
      : c
    )
    setCompromissos(next)
    localStorage.setItem('orion_compromissos', JSON.stringify(next))
  }

  function calcCompromissoStatus(comp) {
    if (comp.status === 'pago') return 'pago'
    const hoje = new Date()
    hoje.setHours(0,0,0,0)
    const venc = new Date(comp.vencimento)
    venc.setHours(0,0,0,0)
    const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'atrasado'
    if (diff <= 3) return 'vencendo'
    return 'a_vencer'
  }

  // ── MÓDULOS POR EMPRESA ──
  function getEmpresaModulos(empresaId) {
    try {
      const saved = JSON.parse(localStorage.getItem('orion_empresa_modulos') || '{}')
      return saved[empresaId] || DEFAULT_MODULOS
    } catch { return DEFAULT_MODULOS }
  }

  function setEmpresaModulos(empresaId, modulos) {
    try {
      const saved = JSON.parse(localStorage.getItem('orion_empresa_modulos') || '{}')
      saved[empresaId] = modulos
      localStorage.setItem('orion_empresa_modulos', JSON.stringify(saved))
    } catch {}
  }

  // ── AGENDA ──
  function addAgendaItem(item) {
    const next = [...agenda, { ...item, id: Date.now().toString() }]
    setAgenda(next)
    localStorage.setItem('orion_agenda', JSON.stringify(next))
  }

  function removeAgendaItem(itemId) {
    const next = agenda.filter(a => a.id !== itemId)
    setAgenda(next)
    localStorage.setItem('orion_agenda', JSON.stringify(next))
  }

  // ── ALERTAS V5 ──
  function generateAlertsV5() {
    const alerts = []
    const now = new Date()

    empresasVisiveis.filter(e => e.id !== 'gp').forEach(e => {
      // 1. Inadimplência acima do limite
      const inadKpi = getKpis(e.id).find(k => k.label?.toLowerCase().includes('inadim'))
      if (inadKpi) {
        const val = parseFloat(inadKpi.valor)
        if (val > 5) alerts.push({ level: 'critico', tipo: 'inadimplencia', text: `${e.nome} — Inadimplência em ${inadKpi.valor} (limite: 5%)`, emp: e.id })
        else if (val > 3) alerts.push({ level: 'atencao', tipo: 'inadimplencia', text: `${e.nome} — Inadimplência em ${inadKpi.valor} (atenção: acima de 3%)`, emp: e.id })
      }

      // 2. Meta em risco
      const dia = now.getDate()
      if (e.meta > 0) {
        const pct = (e.faturamento / e.meta) * 100
        if (pct < 60 && dia >= 20) alerts.push({ level: 'critico', tipo: 'meta', text: `${e.nome} — Meta em risco: ${pct.toFixed(0)}% atingida (dia ${dia}/30)`, emp: e.id })
        else if (pct < 60) alerts.push({ level: 'atencao', tipo: 'meta', text: `${e.nome} — Meta mensal em ${pct.toFixed(0)}% — acompanhar`, emp: e.id })
      }

      // 3. Contratos vencendo em 30 dias
      getContratos(e.id).forEach(c => {
        if (!c.vencimento) return
        const venc = new Date(c.vencimento)
        const diff = Math.ceil((venc - now) / (1000 * 60 * 60 * 24))
        if (diff <= 30 && diff > 0) alerts.push({ level: 'atencao', tipo: 'contrato', text: `${e.nome} — Contrato "${c.nome}" vence em ${diff} dias`, emp: e.id })
        if (c.status === 'inadim') alerts.push({ level: 'critico', tipo: 'contrato', text: `${e.nome} — Contrato "${c.nome}" inadimplente`, emp: e.id })
      })

      // 4. Tarefas alta prioridade
      const altaPend = getTarefas(e.id).filter(t => t.prioridade === 'alta' && t.status !== 'done')
      if (altaPend.length >= 3) alerts.push({ level: 'atencao', tipo: 'tarefa', text: `${e.nome} — ${altaPend.length} tarefas de alta prioridade pendentes`, emp: e.id })

      // 5. Saldo projetado negativo
      const cf = getCashFlow(e.id, 30)
      if (cf.alertaNegativo) alerts.push({ level: 'critico', tipo: 'fluxo', text: `${e.nome} — Saldo projetado NEGATIVO nos próximos 30 dias`, emp: e.id })
    })

    return alerts.sort((a, b) => (a.level === 'critico' ? -1 : 1))
  }

  function generateAlerts() {
    const alerts = []
    // Alertas segmentados — apenas empresas visíveis ao usuário
    empresasVisiveis.filter(e => e.id !== 'gp').forEach(e => {
      const inadKpi = getKpis(e.id).find(k => k.label.toLowerCase().includes('inadim'))
      if (inadKpi) {
        const val = parseFloat(inadKpi.valor)
        if (val > 5) alerts.push({ level: 'critico', text: `${e.nome} — Inadimplencia em ${inadKpi.valor} (limite: 5%)`, emp: e.id })
      }
      if (e.meta > 0) {
        const pct = ((e.faturamento / e.meta) * 100).toFixed(0)
        if (pct < 50) alerts.push({ level: 'atencao', text: `${e.nome} — Meta mensal: apenas ${pct}% atingida (${fmt(e.faturamento)} / ${fmt(e.meta)})`, emp: e.id })
      }
      getContratos(e.id).filter(c => c.status === 'inadim').forEach(c => {
        alerts.push({ level: 'critico', text: `${e.nome} — Contrato ${c.nome} inadimplente`, emp: e.id })
      })
      const altaPend = getTarefas(e.id).filter(t => t.prioridade === 'alta' && t.status !== 'done')
      if (altaPend.length >= 3) alerts.push({ level: 'atencao', text: `${e.nome} — ${altaPend.length} tarefas de alta prioridade`, emp: e.id })
    })
    return alerts
  }

  // ── AUTOMAÇÕES LINKSYNC ──
  function logAutomacao(empresaId, tipo, descricao) {
    const entry = { id: Date.now().toString(), empresa_id: empresaId, tipo, descricao, created_at: new Date().toISOString() }
    try {
      const log = JSON.parse(localStorage.getItem('orion_automacoes_log') || '[]')
      log.unshift(entry)
      if (log.length > 200) log.length = 200
      localStorage.setItem('orion_automacoes_log', JSON.stringify(log))
    } catch (_) {}
    return entry
  }

  function getAutomacoesLog(empresaId) {
    try {
      const log = JSON.parse(localStorage.getItem('orion_automacoes_log') || '[]')
      return empresaId ? log.filter(l => l.empresa_id === empresaId) : log
    } catch { return [] }
  }

  // Hook: quando arquivo é adicionado na pasta Extratos → sugerir classificação
  const _origAddArquivo = addArquivo
  function addArquivoWithHook(arquivo) {
    _origAddArquivo(arquivo)
    if (arquivo.categoria?.toLowerCase().includes('extrato') || arquivo.nome?.toLowerCase().includes('extrato')) {
      logAutomacao(arquivo.empresa_id, 'classificacao_sugerida', `MAXXXI: arquivo "${arquivo.nome}" enviado em Extratos — classificação sugerida automaticamente`)
    }
  }

  // Hook: quando tarefa é concluída → log automação
  const _origUpdateTask = updateTask
  async function updateTaskWithHook(taskId, updates) {
    await _origUpdateTask(taskId, updates)
    if (updates.status === 'done') {
      const task = tarefas.find(t => t.id === taskId)
      if (task) {
        logAutomacao(task.empresa_id, 'tarefa_concluida', `Tarefa "${task.titulo}" concluída`)
      }
    }
  }

  return (
    <DataContext.Provider value={{
      empresas: empresasVisiveis, // filtradas pelo acesso do usuário
      _allEmpresas: empresas,      // todas, para uso interno
      tarefas, kpis, okrs, contratos, riscos, decisoes, crmLeads,
      checkin, loaded, fmt,
      getEmpresa, getKpis, getOkrs, getTarefas, getContratos, getRiscos, getDecisoes, getCrmLeads,
      addTask, updateTask: updateTaskWithHook, deleteTask, saveCheckin, generateAlerts, reload: loadAll,
      setCrmLeads,
      // Financeiro v4
      CLASSIFICATION_BANK, REVENUE_ORIGINS, BANKS,
      lancamentos, pendingClassifications,
      addLancamento, approveLancamento, deleteLancamento, updateLancamento,
      getLancamentosByEmpresa, getResumoFinanceiro,
      // Arquivos
      arquivos, addArquivo: addArquivoWithHook, deleteArquivo,
      // MAXXXI aprendizado
      maxxxi_learned, learnClassification, suggestClassification,
      // v5 — novos
      calculateHealthScore,
      getScoreHistory,
      getCashFlow,
      getDRE,
      getPipeline,
      generateAlertsV5,
      getPatrimonio,
      savePatrimonio,
      agenda,
      addAgendaItem,
      removeAgendaItem,
      // Empresas CRUD
      addEmpresa, updateEmpresa, removeEmpresa, uploadLogoEmpresa,
      // Biblioteca
      biblioteca, getBiblioteca, addBibliotecaItem, deleteBibliotecaItem, uploadBibliotecaFile,
      // Compromissos
      compromissos, getCompromissos, addCompromisso, updateCompromisso, deleteCompromisso, marcarPago, calcCompromissoStatus,
      // Módulos configuráveis
      DEFAULT_MODULOS, getEmpresaModulos, setEmpresaModulos,
      // Automações LinkSync
      logAutomacao, getAutomacoesLog,
    }}>
      {children}
    </DataContext.Provider>
  )
}
