import { useState, useMemo } from 'react'
import { useData, CLASSIFICATION_BANK } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import Compromissos from './Compromissos'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtVal(v) {
  if (!v && v !== 0) return '—'
  const abs = Math.abs(v)
  const prefix = v < 0 ? '-R$ ' : 'R$ '
  if (abs >= 1000000) return prefix + (abs / 1000000).toFixed(1) + 'M'
  if (abs >= 1000) return prefix + (abs / 1000).toFixed(1) + 'k'
  return prefix + abs.toLocaleString('pt-BR')
}

function pct(a, total) {
  if (!total) return '0'
  return ((a / total) * 100).toFixed(1)
}

export default function Financeiro() {
  const { empresas, lancamentos, addLancamento, deleteLancamento, BANKS, REVENUE_ORIGINS } = useData()
  const { canDelete, logAction } = useAuth()

  const [activeTab, setActiveTab] = useState('resumo')
  const [filtroEmp, setFiltroEmp] = useState('all')
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7))
  const [filtroBanco, setFiltroBanco] = useState('all')
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})
  const [form, setForm] = useState({
    empresa_id: 'dw', tipo: 'despesa', categoria: 'PESSOAL', subcategoria: 'Salários',
    banco: 'Nubank', origem: 'PIX', valor: '', mes: new Date().toISOString().slice(0, 7),
    descricao: '', status: 'aprovado'
  })

  // Meses anteriores para comparativo
  function prevMonths(mes, n) {
    const [y, m] = mes.split('-').map(Number)
    const months = []
    for (let i = n; i >= 0; i--) {
      let mm = m - i
      let yy = y
      while (mm <= 0) { mm += 12; yy-- }
      months.push(`${yy}-${String(mm).padStart(2, '0')}`)
    }
    return months
  }

  const mesesComp = prevMonths(filtroMes, 3) // [m-3, m-2, m-1, m]

  // Filtros base
  const lancBase = useMemo(() => {
    return lancamentos.filter(l => {
      const empOk = filtroEmp === 'all' || l.empresa_id === filtroEmp
      const bancoOk = filtroBanco === 'all' || l.banco === filtroBanco
      const tipoOk = filtroTipo === 'all' || l.tipo === filtroTipo
      const statusOk = filtroStatus === 'all' || l.status === filtroStatus
      return empOk && bancoOk && tipoOk && statusOk
    })
  }, [lancamentos, filtroEmp, filtroBanco, filtroTipo, filtroStatus])

  const lancMes = lancBase.filter(l => l.mes === filtroMes && l.status === 'aprovado')
  const receitas = lancMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const despesas = lancMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const resultado = receitas - despesas
  const margem = receitas > 0 ? ((resultado / receitas) * 100).toFixed(1) : 0

  // Mês anterior para variação
  const [prevY, prevM] = filtroMes.split('-').map(Number)
  let prevMM = prevM - 1, prevYY = prevY
  if (prevMM <= 0) { prevMM = 12; prevYY-- }
  const mesAnterior = `${prevYY}-${String(prevMM).padStart(2, '0')}`
  const lancMesAnt = lancBase.filter(l => l.mes === mesAnterior && l.status === 'aprovado')
  const receitasAnt = lancMesAnt.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const despesasAnt = lancMesAnt.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const resultadoAnt = receitasAnt - despesasAnt

  function varPct(cur, prev) {
    if (!prev) return null
    return ((cur / prev - 1) * 100).toFixed(1)
  }

  // Por categoria
  const porCategoria = useMemo(() => {
    const acc = {}
    lancMes.forEach(l => {
      if (!acc[l.categoria]) acc[l.categoria] = { receitas: 0, despesas: 0, subcats: {} }
      if (l.tipo === 'receita') acc[l.categoria].receitas += l.valor
      else acc[l.categoria].despesas += l.valor
      const sub = l.subcategoria || 'Outros'
      if (!acc[l.categoria].subcats[sub]) acc[l.categoria].subcats[sub] = { receitas: 0, despesas: 0 }
      if (l.tipo === 'receita') acc[l.categoria].subcats[sub].receitas += l.valor
      else acc[l.categoria].subcats[sub].despesas += l.valor
    })
    return acc
  }, [lancMes])

  // Por banco
  const porBanco = useMemo(() => {
    const acc = {}
    lancMes.forEach(l => {
      const b = l.banco || 'Não informado'
      if (!acc[b]) acc[b] = { entradas: 0, saidas: 0 }
      if (l.tipo === 'receita') acc[b].entradas += l.valor
      else acc[b].saidas += l.valor
    })
    return Object.entries(acc).map(([banco, v]) => ({ banco, ...v, saldo: v.entradas - v.saidas, volume: v.entradas + v.saidas }))
      .sort((a, b) => b.volume - a.volume)
  }, [lancMes])

  // Comparativo
  const compData = mesesComp.map(mes => {
    const items = lancamentos.filter(l => l.mes === mes && l.status === 'aprovado' && (filtroEmp === 'all' || l.empresa_id === filtroEmp))
    const rec = items.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const desp = items.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    const [yy, mm] = mes.split('-').map(Number)
    return { mes, label: MESES_LABEL[mm - 1] + '/' + String(yy).slice(2), receitas: rec, despesas: desp, resultado: rec - desp }
  })

  // YTD
  const ytdItems = lancamentos.filter(l => {
    const [y] = filtroMes.split('-').map(Number)
    const [ly] = (l.mes || '').split('-').map(Number)
    return ly === y && l.status === 'aprovado' && (filtroEmp === 'all' || l.empresa_id === filtroEmp)
  })
  const ytdRec = ytdItems.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const ytdDesp = ytdItems.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

  function saveLancamento() {
    if (!form.descricao || !form.valor) return
    addLancamento({
      ...form,
      valor: parseFloat(form.valor),
      data: new Date().toISOString().slice(0, 10),
    })
    logAction('LANCAMENTO_FINANCEIRO', `${form.descricao} — ${fmtVal(parseFloat(form.valor))}`)
    setModalOpen(false)
    setForm(f => ({ ...f, descricao: '', valor: '' }))
  }

  const maxBarComp = Math.max(...compData.map(m => Math.max(m.receitas, m.despesas)), 1)

  const TABS = ['resumo', 'bancos', 'natureza', 'lancamentos', 'comparativo', 'compromissos']
  const TAB_LABELS = {
    resumo: '📊 Resumo', bancos: '🏦 Por Banco', natureza: '🏷 Por Natureza',
    lancamentos: '📋 Lançamentos', comparativo: '📈 Comparativo', compromissos: '📅 Compromissos'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Financeiro</div>
          <div className="page-subtitle">Relatórios de gestão por empresa e período</div>
        </div>
        <button className="btn btn-blue" onClick={() => setModalOpen(true)}>+ Lançamento</button>
      </div>

      {/* FILTROS GLOBAIS */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <select className="inp" style={{ width:'auto', padding:'7px 12px', fontSize:13 }}
          value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)}>
          <option value="all">Todas as empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <input type="month" className="inp" style={{ width:'auto', padding:'7px 12px', fontSize:13 }}
          value={filtroMes} onChange={e => setFiltroMes(e.target.value)} />
        <select className="inp" style={{ width:'auto', padding:'7px 12px', fontSize:13 }}
          value={filtroBanco} onChange={e => setFiltroBanco(e.target.value)}>
          <option value="all">Todos os bancos</option>
          {(BANKS || []).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* TABS */}
      <div className="tabs mb">
        {TABS.map(t => (
          <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── RESUMO ── */}
      {activeTab === 'resumo' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid-v4 mb">
            <div className="metric-card" style={{ '--accent-c':'var(--green)' }}>
              <span className="metric-label">Total Receitas</span>
              <div className="metric-value txt-green">{fmtVal(receitas)}</div>
              {receitasAnt > 0 && (
                <div className={`metric-delta ${receitas >= receitasAnt ? 'txt-green' : 'txt-red'}`}>
                  {receitas >= receitasAnt ? '▲' : '▼'} {Math.abs(varPct(receitas, receitasAnt))}% vs mês ant.
                </div>
              )}
            </div>
            <div className="metric-card" style={{ '--accent-c':'var(--red)' }}>
              <span className="metric-label">Total Despesas</span>
              <div className="metric-value txt-red">{fmtVal(despesas)}</div>
              {despesasAnt > 0 && (
                <div className={`metric-delta ${despesas <= despesasAnt ? 'txt-green' : 'txt-red'}`}>
                  {despesas <= despesasAnt ? '▼' : '▲'} {Math.abs(varPct(despesas, despesasAnt))}% vs mês ant.
                </div>
              )}
            </div>
            <div className="metric-card" style={{ '--accent-c': resultado >= 0 ? 'var(--green)' : 'var(--red)' }}>
              <span className="metric-label">Resultado</span>
              <div className={`metric-value ${resultado >= 0 ? 'txt-green' : 'txt-red'}`}>{fmtVal(resultado)}</div>
              {resultadoAnt !== 0 && (
                <div className={`metric-delta ${resultado >= resultadoAnt ? 'txt-green' : 'txt-red'}`}>
                  {resultado >= resultadoAnt ? '▲' : '▼'} {Math.abs(varPct(resultado, resultadoAnt))}% vs mês ant.
                </div>
              )}
            </div>
            <div className="metric-card" style={{ '--accent-c':'var(--blue)' }}>
              <span className="metric-label">Margem</span>
              <div className="metric-value txt-blue">{margem}%</div>
              <div className="metric-delta txt-muted">receitas − despesas / receitas</div>
            </div>
          </div>

          {/* Gráfico por categoria */}
          <div className="module-card">
            <div className="module-card-title">📊 Por Categoria — {filtroMes}</div>
            {Object.keys(porCategoria).length === 0 ? (
              <div className="empty-state-v4"><span className="empty-icon">📊</span><div className="empty-text">Sem dados no período</div></div>
            ) : (
              Object.entries(porCategoria).map(([cat, data]) => {
                const total = data.receitas + data.despesas
                const maxTotal = Math.max(...Object.values(porCategoria).map(d => d.receitas + d.despesas), 1)
                return (
                  <div key={cat} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <div style={{ width:120, fontSize:12, fontWeight:600, color:'var(--tx2)', flexShrink:0 }}>{cat}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:3 }}>
                          <div style={{ width: `${pct(data.receitas, maxTotal)}%`, height:8, background:'var(--green)', borderRadius:'4px 0 0 4px', transition:'width .4s', minWidth: data.receitas > 0 ? 4 : 0 }}></div>
                          <div style={{ width: `${pct(data.despesas, maxTotal)}%`, height:8, background:'var(--red)', borderRadius:'0 4px 4px 0', transition:'width .4s', minWidth: data.despesas > 0 ? 4 : 0 }}></div>
                        </div>
                      </div>
                      <div style={{ width:120, textAlign:'right', fontSize:12, color:'var(--tx3)', flexShrink:0 }}>
                        <span style={{ color:'var(--green)' }}>{data.receitas > 0 ? '+' + fmtVal(data.receitas) : ''}</span>
                        {data.receitas > 0 && data.despesas > 0 && ' · '}
                        <span style={{ color:'var(--red)' }}>{data.despesas > 0 ? '-' + fmtVal(data.despesas) : ''}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* ── POR BANCO ── */}
      {activeTab === 'bancos' && (
        <div className="module-card">
          <div className="module-card-title">🏦 Por Banco — {filtroMes}</div>
          {porBanco.length === 0 ? (
            <div className="empty-state-v4"><span className="empty-icon">🏦</span><div className="empty-text">Sem lançamentos no período</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Banco</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Volume</th></tr>
              </thead>
              <tbody>
                {porBanco.map(b => {
                  const maxVol = Math.max(...porBanco.map(x => x.volume), 1)
                  return (
                    <tr key={b.banco}>
                      <td style={{ fontWeight:600, color:'var(--tx)' }}>🏦 {b.banco}</td>
                      <td style={{ color:'var(--green)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{b.entradas > 0 ? '+' + fmtVal(b.entradas) : '—'}</td>
                      <td style={{ color:'var(--red)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{b.saidas > 0 ? '-' + fmtVal(b.saidas) : '—'}</td>
                      <td style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color: b.saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtVal(b.saldo)}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:80, height:6, background:'var(--s3)', borderRadius:3 }}>
                            <div style={{ width:`${(b.volume / maxVol) * 100}%`, height:'100%', background:'var(--blue)', borderRadius:3 }}></div>
                          </div>
                          <span style={{ fontSize:11, color:'var(--tx3)' }}>{pct(b.volume, porBanco.reduce((s, x) => s + x.volume, 0))}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── POR NATUREZA (TREE VIEW) ── */}
      {activeTab === 'natureza' && (
        <div className="module-card">
          <div className="module-card-title">🏷 Por Natureza — {filtroMes}</div>
          {Object.keys(porCategoria).length === 0 ? (
            <div className="empty-state-v4"><span className="empty-icon">🏷</span><div className="empty-text">Sem dados no período</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Categoria / Subcategoria</th><th>Receitas</th><th>Despesas</th><th>% do Total</th></tr>
              </thead>
              <tbody>
                {Object.entries(porCategoria).map(([cat, data]) => {
                  const totalGeral = Object.values(porCategoria).reduce((s, d) => s + d.receitas + d.despesas, 0)
                  const catTotal = data.receitas + data.despesas
                  const isExpanded = expandedCats[cat]
                  return [
                    <tr key={cat} style={{ cursor:'pointer', background:'rgba(255,255,255,0.02)' }} onClick={() => setExpandedCats(e => ({ ...e, [cat]: !e[cat] }))}>
                      <td style={{ fontWeight:700, color:'var(--gold)' }}>
                        {isExpanded ? '▾' : '▸'} {cat}
                      </td>
                      <td style={{ color:'var(--green)', fontWeight:600 }}>{data.receitas > 0 ? fmtVal(data.receitas) : '—'}</td>
                      <td style={{ color:'var(--red)', fontWeight:600 }}>{data.despesas > 0 ? fmtVal(data.despesas) : '—'}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className="progress-bar-v4" style={{ width:60 }}>
                            <div className="progress-fill-v4" style={{ width:`${pct(catTotal, totalGeral)}%` }}></div>
                          </div>
                          <span style={{ fontSize:11, color:'var(--tx3)' }}>{pct(catTotal, totalGeral)}%</span>
                        </div>
                      </td>
                    </tr>,
                    ...(isExpanded ? Object.entries(data.subcats).map(([sub, sv]) => (
                      <tr key={cat + sub} style={{ background:'rgba(59,130,246,0.03)' }}>
                        <td style={{ paddingLeft:28, fontSize:12, color:'var(--tx2)' }}>↳ {sub}</td>
                        <td style={{ color:'var(--green)', fontSize:12 }}>{sv.receitas > 0 ? fmtVal(sv.receitas) : '—'}</td>
                        <td style={{ color:'var(--red)', fontSize:12 }}>{sv.despesas > 0 ? fmtVal(sv.despesas) : '—'}</td>
                        <td style={{ fontSize:11, color:'var(--tx3)' }}>{pct(sv.receitas + sv.despesas, catTotal)}%</td>
                      </tr>
                    )) : [])
                  ]
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── LANÇAMENTOS ── */}
      {activeTab === 'lancamentos' && (
        <div className="module-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div className="module-card-title" style={{ margin:0 }}>📋 Lançamentos ({lancBase.length})</div>
            <div style={{ display:'flex', gap:8 }}>
              <select className="inp" style={{ width:'auto', padding:'5px 10px', fontSize:12 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="all">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
              <select className="inp" style={{ width:'auto', padding:'5px 10px', fontSize:12 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="all">Todos status</option>
                <option value="aprovado">Aprovado</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th><th>Descrição</th><th>Empresa</th><th>Categoria</th>
                <th>Banco</th><th>Tipo</th><th>Valor</th><th>Status</th>
                {canDelete && <th></th>}
              </tr>
            </thead>
            <tbody>
              {lancBase.sort((a, b) => (b.data || b.mes || '').localeCompare(a.data || a.mes || '')).map(l => {
                const emp = empresas.find(e => e.id === l.empresa_id)
                return (
                  <tr key={l.id}>
                    <td style={{ color:'var(--tx3)', fontSize:11, whiteSpace:'nowrap' }}>{l.data ? new Date(l.data).toLocaleDateString('pt-BR') : l.mes}</td>
                    <td style={{ fontWeight:500, color:'var(--tx)' }}>{l.descricao}</td>
                    <td>{emp ? <span className="pill pill-blue" style={{ fontSize:10 }}>{emp.sigla}</span> : '—'}</td>
                    <td style={{ fontSize:12 }}>{l.categoria}{l.subcategoria ? ` / ${l.subcategoria}` : ''}</td>
                    <td style={{ fontSize:12, color:'var(--tx3)' }}>{l.banco || '—'}</td>
                    <td><span className={`status-badge ${l.tipo === 'receita' ? 'success' : 'danger'}`} style={{ fontSize:9 }}>{l.tipo}</span></td>
                    <td style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color: l.tipo === 'receita' ? 'var(--green)' : 'var(--red)' }}>
                      {l.tipo === 'receita' ? '+' : '-'}{fmtVal(l.valor)}
                    </td>
                    <td><span className={`status-badge ${l.status === 'aprovado' ? 'success' : 'warning'}`} style={{ fontSize:9 }}>{l.status}</span></td>
                    {canDelete && (
                      <td>
                        <button className="btn btn-icon" style={{ color:'var(--red)', fontSize:13 }} onClick={() => deleteLancamento(l.id)} title="Excluir">🗑</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── COMPARATIVO ── */}
      {activeTab === 'comparativo' && (
        <div>
          {/* Gráfico de barras */}
          <div className="module-card mb">
            <div className="module-card-title">📊 Comparativo — 4 meses</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:20, height:160, paddingTop:8 }}>
              {compData.map((m, i) => (
                <div key={m.mes} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:10, color:'var(--tx3)' }}>{fmtVal(m.resultado)}</div>
                  <div style={{ width:'100%', display:'flex', gap:4, alignItems:'flex-end', height:120 }}>
                    <div style={{ flex:1, height:`${(m.receitas / maxBarComp) * 110}px`, background:'var(--green)', borderRadius:'3px 3px 0 0', opacity:.85, minHeight:2 }}></div>
                    <div style={{ flex:1, height:`${(m.despesas / maxBarComp) * 110}px`, background:'var(--red)', borderRadius:'3px 3px 0 0', opacity:.85, minHeight:2 }}></div>
                  </div>
                  <div style={{ fontSize:11, fontWeight: m.mes === filtroMes ? 700 : 400, color: m.mes === filtroMes ? 'var(--blue3)' : 'var(--tx3)' }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:16, marginTop:12, justifyContent:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--tx3)' }}><div style={{ width:12, height:8, background:'var(--green)', borderRadius:2 }}></div> Receitas</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--tx3)' }}><div style={{ width:12, height:8, background:'var(--red)', borderRadius:2 }}></div> Despesas</div>
            </div>
          </div>

          {/* Tabela comparativa */}
          <div className="module-card mb">
            <div className="module-card-title">📋 Tabela Comparativa</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Período</th><th>Receitas</th><th>Despesas</th><th>Resultado</th><th>Margem</th><th>Δ Resultado</th>
                </tr>
              </thead>
              <tbody>
                {compData.map((m, i) => {
                  const prev = compData[i - 1]
                  const delta = prev ? varPct(m.resultado, prev.resultado) : null
                  const marg = m.receitas > 0 ? ((m.resultado / m.receitas) * 100).toFixed(1) : 0
                  return (
                    <tr key={m.mes} style={{ background: m.mes === filtroMes ? 'rgba(59,130,246,0.05)' : undefined }}>
                      <td style={{ fontWeight: m.mes === filtroMes ? 700 : 400, color: m.mes === filtroMes ? 'var(--blue3)' : 'var(--tx)' }}>
                        {m.label} {m.mes === filtroMes && <span className="status-badge info" style={{ fontSize:9, marginLeft:4 }}>atual</span>}
                      </td>
                      <td style={{ color:'var(--green)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{fmtVal(m.receitas)}</td>
                      <td style={{ color:'var(--red)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{fmtVal(m.despesas)}</td>
                      <td style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color: m.resultado >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtVal(m.resultado)}</td>
                      <td style={{ color:'var(--tx3)', fontSize:13 }}>{marg}%</td>
                      <td>
                        {delta !== null ? (
                          <span style={{ fontSize:12, fontWeight:700, color: parseFloat(delta) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {parseFloat(delta) >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
                          </span>
                        ) : <span style={{ color:'var(--tx3)', fontSize:12 }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
                {/* YTD */}
                <tr style={{ background:'rgba(212,175,55,0.05)', borderTop:'1px solid var(--border-gold)' }}>
                  <td style={{ fontWeight:700, color:'var(--gold)' }}>YTD {filtroMes.slice(0, 4)}</td>
                  <td style={{ color:'var(--green)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{fmtVal(ytdRec)}</td>
                  <td style={{ color:'var(--red)', fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{fmtVal(ytdDesp)}</td>
                  <td style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color: ytdRec - ytdDesp >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtVal(ytdRec - ytdDesp)}</td>
                  <td style={{ color:'var(--tx3)', fontSize:13 }}>{ytdRec > 0 ? (((ytdRec - ytdDesp) / ytdRec) * 100).toFixed(1) : 0}%</td>
                  <td><span className="status-badge gold" style={{ fontSize:9 }}>acumulado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COMPROMISSOS ── */}
      {activeTab === 'compromissos' && (
        <Compromissos empresaId={filtroEmp === 'all' ? null : filtroEmp} />
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {modalOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ width:520 }}>
            <div className="modal-title">
              <span>💳 Novo Lançamento</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="form-row-v4 cols-2" style={{ marginBottom:12 }}>
              <div>
                <label className="form-label">Empresa</label>
                <select className="inp" value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Tipo</label>
                <select className="inp" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>
              </div>
            </div>

            <div className="form-row-v4 cols-2" style={{ marginBottom:12 }}>
              <div>
                <label className="form-label">Categoria</label>
                <select className="inp" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value, subcategoria: '' }))}>
                  {Object.keys(CLASSIFICATION_BANK).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Subcategoria</label>
                <select className="inp" value={form.subcategoria} onChange={e => setForm(f => ({ ...f, subcategoria: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {(CLASSIFICATION_BANK[form.categoria] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row-v4 cols-2" style={{ marginBottom:12 }}>
              <div>
                <label className="form-label">Banco</label>
                <select className="inp" value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}>
                  {(BANKS || []).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {form.tipo === 'receita' && (
                <div>
                  <label className="form-label">Origem</label>
                  <select className="inp" value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))}>
                    {(REVENUE_ORIGINS || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="inp" placeholder="Ex.: Salário equipe, Aluguel, etc." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>

            <div className="form-row-v4 cols-2">
              <div>
                <label className="form-label">Valor (R$)</label>
                <input className="inp" type="number" min="0" step="0.01" placeholder="Ex.: 2500" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Mês Competência</label>
                <input type="month" className="inp" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} />
              </div>
            </div>

            <button className="btn-primary" style={{ marginTop:16 }} onClick={saveLancamento}>Registrar Lançamento</button>
          </div>
        </div>
      )}
    </div>
  )
}
