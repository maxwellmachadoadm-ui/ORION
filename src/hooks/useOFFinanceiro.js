import { useState, useEffect, useCallback } from 'react'

// ── Demo data (localStorage fallback) ──
const LS_KEY = 'orion_of_fin'
function loadLS() { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null } }
function saveLS(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)) }

const DEMO_PROJETOS = [
  { id:'p1', nome:'Medicina UNIFENAS 2026', turma:'Med 2026', instituicao:'UNIFENAS', curso:'Medicina', cidade:'Alfenas', data_inicio:'2024-03-01', data_fim:'2026-12-15', status:'producao', num_clientes_esperados:45, num_clientes_confirmados:38, num_clientes_pagantes:35, ticket_medio_esperado:5000, ticket_medio_contratado:4800, meta_receita:225000 },
  { id:'p2', nome:'Direito PUC 2027', turma:'Dir 2027', instituicao:'PUC Minas', curso:'Direito', cidade:'BH', data_inicio:'2024-08-01', data_fim:'2027-07-15', status:'producao', num_clientes_esperados:60, num_clientes_confirmados:42, num_clientes_pagantes:38, ticket_medio_esperado:4200, ticket_medio_contratado:4000, meta_receita:252000 },
  { id:'p3', nome:'Enfermagem UEMG 2027', turma:'Enf 2027', instituicao:'UEMG', curso:'Enfermagem', cidade:'Divinópolis', data_inicio:'2024-06-01', data_fim:'2027-06-30', status:'producao', num_clientes_esperados:30, num_clientes_confirmados:22, num_clientes_pagantes:18, ticket_medio_esperado:3800, ticket_medio_contratado:3500, meta_receita:114000 },
  { id:'p4', nome:'Odonto UNIFAL 2026', turma:'Odo 2026', instituicao:'UNIFAL', curso:'Odontologia', cidade:'Alfenas', data_inicio:'2023-03-01', data_fim:'2026-06-30', status:'entregue', num_clientes_esperados:25, num_clientes_confirmados:25, num_clientes_pagantes:24, ticket_medio_esperado:5500, ticket_medio_contratado:5200, meta_receita:137500 },
  { id:'p5', nome:'Farmácia UFLA 2028', turma:'Farm 2028', instituicao:'UFLA', curso:'Farmácia', cidade:'Lavras', data_inicio:'2025-03-01', data_fim:'2028-12-15', status:'captacao', num_clientes_esperados:35, num_clientes_confirmados:8, num_clientes_pagantes:0, ticket_medio_esperado:4000, ticket_medio_contratado:0, meta_receita:140000 },
]

const DEMO_LANCAMENTOS = [
  { id:'l1', projeto_id:'p1', tipo:'receita', natureza:'direta', descricao:'Mensalidades março', valor_previsto:18000, valor_realizado:16500, data_prevista:'2026-03-05', data_realizada:'2026-03-05', competencia:'2026-03', status:'pago', conta_codigo:'1.1' },
  { id:'l2', projeto_id:'p1', tipo:'despesa', natureza:'direta', descricao:'Fotógrafo ensaio individual', valor_previsto:3500, valor_realizado:3500, data_prevista:'2026-03-10', data_realizada:'2026-03-10', competencia:'2026-03', status:'pago', conta_codigo:'3.1' },
  { id:'l3', projeto_id:'p1', tipo:'despesa', natureza:'direta', descricao:'Impressão álbuns lote 1', valor_previsto:4200, valor_realizado:4800, data_prevista:'2026-03-20', data_realizada:'2026-03-22', competencia:'2026-03', status:'pago', conta_codigo:'3.2' },
  { id:'l4', projeto_id:'p2', tipo:'receita', natureza:'direta', descricao:'Mensalidades março', valor_previsto:14000, valor_realizado:12800, data_prevista:'2026-03-05', data_realizada:'2026-03-07', competencia:'2026-03', status:'pago', conta_codigo:'1.1' },
  { id:'l5', projeto_id:'p2', tipo:'despesa', natureza:'direta', descricao:'Cenografia evento', valor_previsto:2000, valor_realizado:2200, data_prevista:'2026-03-15', data_realizada:'2026-03-15', competencia:'2026-03', status:'pago', conta_codigo:'3.3' },
  { id:'l6', projeto_id:'p3', tipo:'receita', natureza:'direta', descricao:'Mensalidades março', valor_previsto:6600, valor_realizado:5400, data_prevista:'2026-03-05', data_realizada:'2026-03-08', competencia:'2026-03', status:'pago', conta_codigo:'1.1' },
  { id:'l7', projeto_id:null, tipo:'despesa', natureza:'fixa', descricao:'Aluguel estúdio', valor_previsto:3500, valor_realizado:3500, data_prevista:'2026-03-01', data_realizada:'2026-03-01', competencia:'2026-03', status:'pago', conta_codigo:'2.4' },
  { id:'l8', projeto_id:null, tipo:'despesa', natureza:'fixa', descricao:'Pró-labore', valor_previsto:8000, valor_realizado:8000, data_prevista:'2026-03-05', data_realizada:'2026-03-05', competencia:'2026-03', status:'pago', conta_codigo:'2.1' },
  { id:'l9', projeto_id:null, tipo:'despesa', natureza:'fixa', descricao:'Salários equipe', valor_previsto:7500, valor_realizado:7500, data_prevista:'2026-03-05', data_realizada:'2026-03-05', competencia:'2026-03', status:'pago', conta_codigo:'2.2' },
  { id:'l10', projeto_id:'p1', tipo:'receita', natureza:'direta', descricao:'Mensalidades abril', valor_previsto:18000, valor_realizado:17200, data_prevista:'2026-04-05', data_realizada:'2026-04-06', competencia:'2026-04', status:'pago', conta_codigo:'1.1' },
  { id:'l11', projeto_id:'p2', tipo:'receita', natureza:'direta', descricao:'Mensalidades abril', valor_previsto:14000, valor_realizado:0, data_prevista:'2026-04-05', competencia:'2026-04', status:'previsto', conta_codigo:'1.1' },
  { id:'l12', projeto_id:'p1', tipo:'despesa', natureza:'direta', descricao:'Impostos março', valor_previsto:1200, valor_realizado:1150, data_prevista:'2026-03-20', data_realizada:'2026-03-20', competencia:'2026-03', status:'pago', conta_codigo:'3.7' },
]

const DEMO_PARCELAS = [
  { id:'pc1', projeto_id:'p1', cliente_nome:'Ana Paula Silva', valor:800, data_vencimento:'2026-03-10', data_pagamento:'2026-03-10', status:'pago', numero_parcela:8, total_parcelas:24 },
  { id:'pc2', projeto_id:'p1', cliente_nome:'Carlos Eduardo', valor:800, data_vencimento:'2026-03-10', data_pagamento:null, status:'aberto', numero_parcela:8, total_parcelas:24 },
  { id:'pc3', projeto_id:'p1', cliente_nome:'Mariana Costa', valor:800, data_vencimento:'2026-02-10', data_pagamento:null, status:'aberto', numero_parcela:7, total_parcelas:24 },
  { id:'pc4', projeto_id:'p2', cliente_nome:'Pedro Henrique', valor:700, data_vencimento:'2026-03-15', data_pagamento:'2026-03-16', status:'pago', numero_parcela:5, total_parcelas:36 },
  { id:'pc5', projeto_id:'p2', cliente_nome:'Julia Ferreira', valor:700, data_vencimento:'2026-02-15', data_pagamento:null, status:'aberto', numero_parcela:4, total_parcelas:36 },
  { id:'pc6', projeto_id:'p2', cliente_nome:'Lucas Oliveira', valor:700, data_vencimento:'2026-01-15', data_pagamento:null, status:'aberto', numero_parcela:3, total_parcelas:36 },
  { id:'pc7', projeto_id:'p3', cliente_nome:'Fernanda Lima', valor:600, data_vencimento:'2026-03-10', data_pagamento:'2026-03-12', status:'pago', numero_parcela:6, total_parcelas:18 },
  { id:'pc8', projeto_id:'p3', cliente_nome:'Rafael Santos', valor:600, data_vencimento:'2026-02-10', data_pagamento:null, status:'aberto', numero_parcela:5, total_parcelas:18 },
  { id:'pc9', projeto_id:'p3', cliente_nome:'Camila Souza', valor:600, data_vencimento:'2025-12-10', data_pagamento:null, status:'aberto', numero_parcela:3, total_parcelas:18 },
]

const DEMO_RATEIOS = [
  { id:'r1', lancamento_id:'l7', projeto_id:'p1', valor_original:3500, percentual:40, valor_rateado:1400, competencia:'2026-03' },
  { id:'r2', lancamento_id:'l7', projeto_id:'p2', valor_original:3500, percentual:35, valor_rateado:1225, competencia:'2026-03' },
  { id:'r3', lancamento_id:'l7', projeto_id:'p3', valor_original:3500, percentual:25, valor_rateado:875, competencia:'2026-03' },
]

const STATUS_LABELS = { captacao: '🔵 Captação', producao: '🟡 Em Produção', entregue: '🟢 Entregue', encerrado: '⚫ Encerrado' }
const STATUS_COLORS = { captacao: '#3b82f6', producao: '#f59e0b', entregue: '#10b981', encerrado: '#64748b' }

export { STATUS_LABELS, STATUS_COLORS }

export default function useOFFinanceiro() {
  const saved = loadLS()
  const [projetos, setProjetos] = useState(saved?.projetos || DEMO_PROJETOS)
  const [lancamentos, setLancamentos] = useState(saved?.lancamentos || DEMO_LANCAMENTOS)
  const [parcelas, setParcelas] = useState(saved?.parcelas || DEMO_PARCELAS)
  const [rateios, setRateios] = useState(saved?.rateios || DEMO_RATEIOS)

  // Persistir
  useEffect(() => {
    saveLS({ projetos, lancamentos, parcelas, rateios })
  }, [projetos, lancamentos, parcelas, rateios])

  const fmt = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const pct = (v, t) => t > 0 ? ((v / t) * 100).toFixed(1) : '0.0'
  const hoje = new Date().toISOString().slice(0, 10)
  const mesAtual = new Date().toISOString().slice(0, 7)

  // ── DRE por Projeto ──
  const calcularDREProjeto = useCallback((projetoId, competencia) => {
    const comp = competencia || mesAtual
    const proj = projetos.find(p => p.id === projetoId)
    const lancsProj = lancamentos.filter(l => l.projeto_id === projetoId && l.competencia === comp && l.status === 'pago')
    const ratProj = rateios.filter(r => r.projeto_id === projetoId && r.competencia === comp)

    const receitaBruta = lancsProj.filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor_realizado || 0), 0)
    const impostos = lancsProj.filter(l => l.conta_codigo === '3.7').reduce((s, l) => s + (l.valor_realizado || 0), 0)
    const receitaLiquida = receitaBruta - impostos
    const despesasDiretas = lancsProj.filter(l => l.tipo === 'despesa' && l.natureza === 'direta').reduce((s, l) => s + (l.valor_realizado || 0), 0)
    const rateioTotal = ratProj.reduce((s, r) => s + (r.valor_rateado || 0), 0)
    const resultado = receitaLiquida - despesasDiretas - rateioTotal
    const margem = receitaBruta > 0 ? (resultado / receitaBruta * 100).toFixed(1) : '0.0'
    const ticketReal = proj && proj.num_clientes_pagantes > 0 ? receitaBruta / proj.num_clientes_pagantes : 0

    return { receitaBruta, impostos, receitaLiquida, despesasDiretas, rateioTotal, resultado, margem, ticketReal, projeto: proj }
  }, [projetos, lancamentos, rateios, mesAtual])

  // ── DRE Consolidada ──
  const calcularDREConsolidada = useCallback((competencia) => {
    const comp = competencia || mesAtual
    const ativos = projetos.filter(p => p.status === 'producao' || p.status === 'entregue')
    const dres = ativos.map(p => ({ ...calcularDREProjeto(p.id, comp), projeto: p }))
    const receitaTotal = dres.reduce((s, d) => s + d.receitaBruta, 0)
    const despesaTotal = dres.reduce((s, d) => s + d.despesasDiretas + d.rateioTotal, 0)
    const resultadoTotal = receitaTotal - despesaTotal
    const margemMedia = receitaTotal > 0 ? (resultadoTotal / receitaTotal * 100).toFixed(1) : '0.0'
    const ranking = [...dres].sort((a, b) => b.resultado - a.resultado)
    return { receitaTotal, despesaTotal, resultadoTotal, margemMedia, ranking, dres }
  }, [projetos, calcularDREProjeto, mesAtual])

  // ── Inadimplência ──
  const calcularInadimplencia = useCallback((projetoId) => {
    const prcs = projetoId ? parcelas.filter(p => p.projeto_id === projetoId) : parcelas
    const vencidas = prcs.filter(p => p.status === 'aberto' && p.data_vencimento < hoje)
    const totalAberto = prcs.filter(p => p.status === 'aberto').reduce((s, p) => s + p.valor, 0)
    const totalVencido = vencidas.reduce((s, p) => s + p.valor, 0)
    const percentual = totalAberto > 0 ? (totalVencido / totalAberto * 100).toFixed(1) : '0.0'
    const inadimplentes = vencidas.map(p => {
      const dias = Math.floor((new Date(hoje) - new Date(p.data_vencimento)) / 86400000)
      return { ...p, dias_atraso: dias }
    }).sort((a, b) => b.dias_atraso - a.dias_atraso)
    return { totalAberto, totalVencido, percentual, inadimplentes, total: prcs.length, qtdVencidas: vencidas.length }
  }, [parcelas, hoje])

  // ── Break-even ──
  const calcularBreakEven = useCallback((projetoId) => {
    const proj = projetos.find(p => p.id === projetoId)
    if (!proj) return null
    const despFixasRateadas = rateios.filter(r => r.projeto_id === projetoId).reduce((s, r) => s + r.valor_rateado, 0)
    const despDiretas = lancamentos.filter(l => l.projeto_id === projetoId && l.tipo === 'despesa' && l.natureza === 'direta' && l.status !== 'cancelado').reduce((s, l) => s + (l.valor_previsto || 0), 0)
    const custoTotal = despFixasRateadas + despDiretas
    const ticket = proj.ticket_medio_contratado || proj.ticket_medio_esperado || 1
    const clientesNecessarios = Math.ceil(custoTotal / ticket)
    const faltam = Math.max(0, clientesNecessarios - (proj.num_clientes_pagantes || 0))
    const atingido = faltam === 0
    return { custoTotal, ticket, clientesNecessarios, faltam, atingido, valorFalta: faltam * ticket }
  }, [projetos, lancamentos, rateios])

  // ── Orçado vs Realizado ──
  const calcularOrcadoRealizado = useCallback((projetoId) => {
    const lancsProj = lancamentos.filter(l => l.projeto_id === projetoId)
    // Agrupar por conta
    const contas = {}
    lancsProj.forEach(l => {
      const key = l.conta_codigo || l.descricao
      if (!contas[key]) contas[key] = { conta: key, descricao: l.descricao, orcado: 0, realizado: 0 }
      contas[key].orcado += l.valor_previsto || 0
      contas[key].realizado += l.valor_realizado || 0
    })
    return Object.values(contas).map(c => ({
      ...c,
      variacao: c.realizado - c.orcado,
      variacaoPct: c.orcado > 0 ? (((c.realizado - c.orcado) / c.orcado) * 100).toFixed(1) : '0.0',
      status: c.realizado <= c.orcado ? 'ok' : c.realizado <= c.orcado * 1.1 ? 'atencao' : 'estouro',
    }))
  }, [lancamentos])

  // ── Fluxo de Caixa ──
  const calcularFluxoCaixa = useCallback((meses) => {
    const n = meses || 6
    const result = []
    let acumulado = 0
    for (let i = -2; i < n; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i)
      const comp = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const entradasPrev = lancamentos.filter(l => l.tipo === 'receita' && l.competencia === comp).reduce((s, l) => s + (l.valor_previsto || 0), 0)
      const entradasReal = lancamentos.filter(l => l.tipo === 'receita' && l.competencia === comp && l.status === 'pago').reduce((s, l) => s + (l.valor_realizado || 0), 0)
      const saidasPrev = lancamentos.filter(l => l.tipo === 'despesa' && l.competencia === comp).reduce((s, l) => s + (l.valor_previsto || 0), 0)
      const saidasReal = lancamentos.filter(l => l.tipo === 'despesa' && l.competencia === comp && l.status === 'pago').reduce((s, l) => s + (l.valor_realizado || 0), 0)
      const saldo = (entradasReal || entradasPrev) - (saidasReal || saidasPrev)
      acumulado += saldo
      result.push({ comp, label, entradasPrev, entradasReal, saidasPrev, saidasReal, saldo, acumulado })
    }
    return result
  }, [lancamentos])

  // ── Alertas inteligentes ──
  const calcularAlertas = useCallback(() => {
    const alerts = []
    projetos.filter(p => p.status === 'producao').forEach(p => {
      const dre = calcularDREProjeto(p.id, mesAtual)
      if (dre.receitaBruta > 0 && parseFloat(dre.margem) < 15) {
        alerts.push({ level: 'critico', text: `${p.nome} — margem de ${dre.margem}% (abaixo de 15%)`, projeto: p.id })
      }
      const inad = calcularInadimplencia(p.id)
      if (inad.inadimplentes.some(i => i.dias_atraso > 30)) {
        alerts.push({ level: 'critico', text: `${p.nome} — parcelas vencidas há mais de 30 dias (${fmt(inad.totalVencido)})`, projeto: p.id })
      }
      if (parseFloat(inad.percentual) > 15) {
        alerts.push({ level: 'atencao', text: `${p.nome} — inadimplência em ${inad.percentual}%`, projeto: p.id })
      }
      const be = calcularBreakEven(p.id)
      if (be && !be.atingido) {
        alerts.push({ level: 'atencao', text: `${p.nome} — faltam ${be.faltam} clientes para break-even`, projeto: p.id })
      }
    })
    projetos.filter(p => p.status === 'producao' && parseFloat(pct(p.num_clientes_confirmados, p.num_clientes_esperados)) >= 80).forEach(p => {
      alerts.push({ level: 'ok', text: `${p.nome} — meta de clientes ${pct(p.num_clientes_confirmados, p.num_clientes_esperados)}% atingida`, projeto: p.id })
    })
    return alerts
  }, [projetos, calcularDREProjeto, calcularInadimplencia, calcularBreakEven, mesAtual])

  // ── Aplicar Rateio ──
  function aplicarRateio(lancamentoId, tipoRateio, percentuaisManuais) {
    const lanc = lancamentos.find(l => l.id === lancamentoId)
    if (!lanc) return
    const ativos = projetos.filter(p => p.status === 'producao' || p.status === 'entregue')
    if (ativos.length === 0) return

    let pcts = {}
    if (tipoRateio === 'igualitario') {
      const each = 100 / ativos.length
      ativos.forEach(p => { pcts[p.id] = each })
    } else if (tipoRateio === 'proporcional_receita') {
      const totalRec = ativos.reduce((s, p) => {
        const rec = lancamentos.filter(l => l.projeto_id === p.id && l.tipo === 'receita' && l.status === 'pago').reduce((ss, l) => ss + (l.valor_realizado || 0), 0)
        return s + rec
      }, 0) || 1
      ativos.forEach(p => {
        const rec = lancamentos.filter(l => l.projeto_id === p.id && l.tipo === 'receita' && l.status === 'pago').reduce((ss, l) => ss + (l.valor_realizado || 0), 0)
        pcts[p.id] = (rec / totalRec) * 100
      })
    } else if (tipoRateio === 'proporcional_clientes') {
      const totalCli = ativos.reduce((s, p) => s + (p.num_clientes_confirmados || 0), 0) || 1
      ativos.forEach(p => { pcts[p.id] = ((p.num_clientes_confirmados || 0) / totalCli) * 100 })
    } else if (tipoRateio === 'manual' && percentuaisManuais) {
      pcts = percentuaisManuais
    }

    const valor = lanc.valor_realizado || lanc.valor_previsto || 0
    const novosRateios = Object.entries(pcts).map(([projId, perc]) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      lancamento_id: lancamentoId,
      projeto_id: projId,
      valor_original: valor,
      percentual: parseFloat(perc.toFixed(2)),
      valor_rateado: parseFloat((valor * perc / 100).toFixed(2)),
      competencia: lanc.competencia,
    }))
    setRateios(prev => [...prev.filter(r => r.lancamento_id !== lancamentoId), ...novosRateios])
    return novosRateios
  }

  // ── CRUD ──
  function addProjeto(p) { const n = { ...p, id: Date.now().toString(), created_at: new Date().toISOString() }; setProjetos(prev => [n, ...prev]); return n }
  function updateProjeto(id, u) { setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)) }
  function addLancamento(l) { const n = { ...l, id: Date.now().toString(), created_at: new Date().toISOString() }; setLancamentos(prev => [n, ...prev]); return n }
  function updateLancamento(id, u) { setLancamentos(prev => prev.map(l => l.id === id ? { ...l, ...u } : l)) }
  function deleteLancamento(id) { setLancamentos(prev => prev.filter(l => l.id !== id)) }
  function addParcela(p) { const n = { ...p, id: Date.now().toString() }; setParcelas(prev => [n, ...prev]); return n }
  function marcarParcPago(id, dataPg) { setParcelas(prev => prev.map(p => p.id === id ? { ...p, status: 'pago', data_pagamento: dataPg || hoje } : p)) }
  function estornarRateio(lancamentoId) { setRateios(prev => prev.filter(r => r.lancamento_id !== lancamentoId)) }

  // ── Sazonalidade: receita por mês (últimos 12) + projeção 3 meses ──
  const calcularSazonalidade = useCallback(() => {
    const meses = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const comp = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const rec = lancamentos.filter(l => l.tipo === 'receita' && l.competencia === comp && l.status === 'pago').reduce((s, l) => s + (l.valor_realizado || 0), 0)
      meses.push({ comp, label, receita: rec })
    }
    // Projeção: média móvel dos últimos 3 meses com tendência
    const ultimos3 = meses.slice(-3).map(m => m.receita)
    const media3 = ultimos3.reduce((s, v) => s + v, 0) / 3
    const tendencia = ultimos3.length >= 2 ? (ultimos3[2] - ultimos3[0]) / 2 : 0
    const projecao = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i)
      const comp = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const valor = Math.max(0, Math.round(media3 + tendencia * i))
      projecao.push({ comp, label, receita: valor, projetado: true })
    }
    // Identificar picos e vales
    const allRec = meses.map(m => m.receita).filter(v => v > 0)
    const maxRec = Math.max(...allRec, 1)
    const minRec = Math.min(...allRec.filter(v => v > 0), maxRec)
    const picoMes = meses.find(m => m.receita === maxRec)
    const valeMes = allRec.length > 1 ? meses.find(m => m.receita === minRec && m.receita > 0) : null
    return { meses, projecao, media3, tendencia, pico: picoMes, vale: valeMes, maxRec }
  }, [lancamentos])

  return {
    projetos, lancamentos, parcelas, rateios, fmt, pct, hoje, mesAtual,
    calcularDREProjeto, calcularDREConsolidada, calcularInadimplencia,
    calcularBreakEven, calcularOrcadoRealizado, calcularFluxoCaixa, calcularAlertas,
    calcularSazonalidade,
    aplicarRateio, estornarRateio,
    addProjeto, updateProjeto, addLancamento, updateLancamento, deleteLancamento,
    addParcela, marcarParcPago,
  }
}
