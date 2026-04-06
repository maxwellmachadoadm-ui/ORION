import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DEMO_DATA } from '../lib/demoData'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const { user, userCompanies } = useAuth()
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

  const loadAll = useCallback(async () => {
    if (!user) return
    if (isDemoMode) {
      setEmpresas(DEMO_DATA.empresas)
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
    setEmpresas(e.data || [])
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

  return (
    <DataContext.Provider value={{
      empresas: empresasVisiveis, // filtradas pelo acesso do usuário
      _allEmpresas: empresas,      // todas, para uso interno
      tarefas, kpis, okrs, contratos, riscos, decisoes, crmLeads,
      checkin, loaded, fmt,
      getEmpresa, getKpis, getOkrs, getTarefas, getContratos, getRiscos, getDecisoes, getCrmLeads,
      addTask, updateTask, deleteTask, saveCheckin, generateAlerts, reload: loadAll,
      setCrmLeads,
    }}>
      {children}
    </DataContext.Provider>
  )
}
