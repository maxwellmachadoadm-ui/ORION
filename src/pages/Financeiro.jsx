import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

const BANCOS = ['Nubank', 'C6 Bank', 'Caixa Econômica', 'Itaú', 'Bradesco', 'Santander', 'BTG Pactual']
const NATUREZAS = ['Pessoal', 'Operacional', 'Marketing', 'Tecnologia', 'Fornecedores', 'Impostos', 'Folha de Pagamento', 'Aluguel', 'Serviços', 'Outros']
const TIPOS_DESPESA = [
  { id: 'direta', label: 'Direta', desc: 'Custo direto do projeto/empresa', color: '#ef4444' },
  { id: 'fixa_rateada', label: 'Fixa Rateada', desc: 'Custo fixo dividido proporcionalmente entre empresas', color: '#f59e0b' },
  { id: 'fixa_direcionada', label: 'Fixa Direcionada', desc: 'Custo fixo alocado a empresa específica', color: '#8b5cf6' },
]

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Dados demo para o módulo financeiro
const DEMO_LANCAMENTOS = [
  { id: '1', banco: 'Nubank', natureza: 'Operacional', tipo: 'direta', empresa: 'dw', descricao: 'Assinatura softwares contábeis', valor: -2800, mes: 3, ano: 2026 },
  { id: '2', banco: 'C6 Bank', natureza: 'Folha de Pagamento', tipo: 'fixa_direcionada', empresa: 'dw', descricao: 'Salário equipe DW', valor: -12000, mes: 3, ano: 2026 },
  { id: '3', banco: 'Nubank', natureza: 'Tecnologia', tipo: 'fixa_rateada', empresa: 'all', descricao: 'Servidor cloud ORION', valor: -890, mes: 3, ano: 2026 },
  { id: '4', banco: 'Caixa Econômica', natureza: 'Aluguel', tipo: 'fixa_rateada', empresa: 'all', descricao: 'Aluguel escritório matriz', valor: -3500, mes: 3, ano: 2026 },
  { id: '5', banco: 'Nubank', natureza: 'Marketing', tipo: 'direta', empresa: 'fs', descricao: 'Campanha captação turmas', valor: -1200, mes: 3, ano: 2026 },
  { id: '6', banco: 'BTG Pactual', natureza: 'Pessoal', tipo: 'direta', empresa: 'gp', descricao: 'Assessoria de investimentos', valor: -500, mes: 3, ano: 2026 },
  { id: '7', banco: 'Nubank', natureza: 'Impostos', tipo: 'direta', empresa: 'dw', descricao: 'DAS Simples Nacional', valor: -4200, mes: 3, ano: 2026 },
  { id: '8', banco: 'C6 Bank', natureza: 'Operacional', tipo: 'direta', empresa: 'of', descricao: 'Equipamentos fotografia', valor: -1800, mes: 3, ano: 2026 },
  { id: '9', banco: 'Nubank', natureza: 'Operacional', tipo: 'direta', empresa: 'dw', descricao: 'Assinatura softwares contábeis', valor: -2800, mes: 2, ano: 2026 },
  { id: '10', banco: 'C6 Bank', natureza: 'Folha de Pagamento', tipo: 'fixa_direcionada', empresa: 'dw', descricao: 'Salário equipe DW', valor: -12000, mes: 2, ano: 2026 },
  { id: '11', banco: 'Nubank', natureza: 'Tecnologia', tipo: 'fixa_rateada', empresa: 'all', descricao: 'Servidor cloud ORION', valor: -890, mes: 2, ano: 2026 },
  { id: '12', banco: 'Caixa Econômica', natureza: 'Aluguel', tipo: 'fixa_rateada', empresa: 'all', descricao: 'Aluguel escritório matriz', valor: -3500, mes: 2, ano: 2026 },
  { id: '13', banco: 'Nubank', natureza: 'Impostos', tipo: 'direta', empresa: 'dw', descricao: 'DAS Simples Nacional', valor: -4100, mes: 2, ano: 2026 },
  { id: '14', banco: 'Nubank', natureza: 'Operacional', tipo: 'direta', empresa: 'dw', descricao: 'Assinatura softwares contábeis', valor: -2800, mes: 1, ano: 2026 },
  { id: '15', banco: 'Caixa Econômica', natureza: 'Aluguel', tipo: 'fixa_rateada', empresa: 'all', descricao: 'Aluguel escritório matriz', valor: -3500, mes: 1, ano: 2026 },
  { id: '16', banco: 'Nubank', natureza: 'Impostos', tipo: 'direta', empresa: 'dw', descricao: 'DAS Simples Nacional', valor: -3900, mes: 1, ano: 2026 },
]

const BLANK_LANCAMENTO = { banco: 'Nubank', natureza: 'Operacional', tipo: 'direta', empresa: 'dw', descricao: '', valor: '', mes: new Date().getMonth() + 1, ano: 2026 }

function fmt(v) {
  if (!v && v !== 0) return '—'
  const abs = Math.abs(v)
  const prefix = v < 0 ? '-R$ ' : 'R$ '
  if (abs >= 1000000) return prefix + (abs / 1000000).toFixed(1) + 'M'
  if (abs >= 1000) return prefix + (abs / 1000).toFixed(1) + 'k'
  return prefix + abs.toLocaleString('pt-BR')
}

export default function Financeiro() {
  const { empresas } = useData()
  const { logAction } = useAuth()
  const [activeTab, setActiveTab] = useState('resumo')
  const [filtroEmp, setFiltroEmp] = useState('all')
  const [filtroBanco, setFiltroBanco] = useState('all')
  const [filtroMes, setFiltroMes] = useState(3) // Abril
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(BLANK_LANCAMENTO)

  const [lancamentos, setLancamentos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_lancamentos') || JSON.stringify(DEMO_LANCAMENTOS)) }
    catch { return DEMO_LANCAMENTOS }
  })

  function saveLancamento() {
    if (!form.descricao || !form.valor) return
    const novo = { ...form, id: Date.now().toString(), valor: parseFloat(form.valor) * (parseFloat(form.valor) > 0 ? -1 : 1) }
    const next = [novo, ...lancamentos]
    setLancamentos(next)
    localStorage.setItem('orion_lancamentos', JSON.stringify(next))
    logAction('LANCAMENTO_FINANCEIRO', `${form.descricao} — ${fmt(novo.valor)} — ${form.banco}`)
    setModalOpen(false)
    setForm(BLANK_LANCAMENTO)
  }

  // Filtro aplicado
  const lancFiltrados = useMemo(() => {
    return lancamentos.filter(l => {
      const empOk = filtroEmp === 'all' || l.empresa === filtroEmp || l.empresa === 'all'
      const bancoOk = filtroBanco === 'all' || l.banco === filtroBanco
      return empOk && bancoOk
    })
  }, [lancamentos, filtroEmp, filtroBanco])

  // Mês atual vs 3 anteriores vs YTD
  const mesSel = filtroMes
  const meses3 = [mesSel - 3, mesSel - 2, mesSel - 1, mesSel].filter(m => m >= 1)

  const totalPorMes = (mes) => lancFiltrados.filter(l => l.mes === mes && l.ano === 2026).reduce((s, l) => s + l.valor, 0)
  const ytd = lancFiltrados.filter(l => l.ano === 2026 && l.mes <= mesSel).reduce((s, l) => s + l.valor, 0)

  // Por banco (mês selecionado)
  const porBanco = BANCOS.map(banco => ({
    banco,
    total: lancFiltrados.filter(l => l.banco === banco && l.mes === mesSel && l.ano === 2026).reduce((s, l) => s + l.valor, 0),
    qtd: lancFiltrados.filter(l => l.banco === banco && l.mes === mesSel && l.ano === 2026).length,
  })).filter(b => b.qtd > 0)

  // Por natureza
  const porNatureza = NATUREZAS.map(nat => ({
    nat,
    total: lancFiltrados.filter(l => l.natureza === nat && l.mes === mesSel && l.ano === 2026).reduce((s, l) => s + l.valor, 0),
    qtd: lancFiltrados.filter(l => l.natureza === nat && l.mes === mesSel && l.ano === 2026).length,
  })).filter(n => n.qtd > 0).sort((a, b) => a.total - b.total)

  // Por tipo de despesa
  const porTipo = TIPOS_DESPESA.map(t => ({
    ...t,
    total: lancFiltrados.filter(l => l.tipo === t.id && l.mes === mesSel && l.ano === 2026).reduce((s, l) => s + l.valor, 0),
  }))

  const maxNat = Math.abs(Math.min(...porNatureza.map(n => n.total), 0))

  const TABS = ['resumo', 'bancos', 'natureza', 'lancamentos']
  const TAB_LABELS = { resumo: '📊 Resumo', bancos: '🏦 Por Banco', natureza: '🏷 Natureza', lancamentos: '📋 Lançamentos' }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Módulo Financeiro</h1>
          <p>Relatórios por banco, natureza de despesa e comparativo temporal</p>
        </div>
        <button className="btn btn-blue" onClick={() => setModalOpen(true)}>+ Lançamento</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="inp" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }}
          value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)}>
          <option value="all">Todas as empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="inp" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }}
          value={filtroBanco} onChange={e => setFiltroBanco(e.target.value)}>
          <option value="all">Todos os bancos</option>
          {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="inp" style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }}
          value={filtroMes} onChange={e => setFiltroMes(Number(e.target.value))}>
          {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}/2026</option>)}
        </select>
      </div>

      {/* Tabs */}
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
          {/* Cards comparativo */}
          <div className="g4 mb">
            {meses3.map(mes => (
              <div key={mes} className="module-card" style={{ padding: 16, borderTop: mes === mesSel ? '3px solid var(--blue)' : undefined }}>
                <div className="lbl">{mes === mesSel ? `${MESES_LABEL[mes - 1]} (atual)` : MESES_LABEL[mes - 1]}</div>
                <div className={`val${totalPorMes(mes) < 0 ? ' txt-red' : ' txt-green'}`} style={{ fontSize: 22 }}>
                  {fmt(totalPorMes(mes))}
                </div>
                {mes < mesSel && (
                  <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>
                    {((totalPorMes(mesSel) / totalPorMes(mes) - 1) * 100).toFixed(1)}% vs atual
                  </div>
                )}
              </div>
            ))}
            <div className="module-card" style={{ padding: 16, background: 'rgba(59,130,246,.07)', borderColor: 'rgba(59,130,246,.2)' }}>
              <div className="lbl">YTD Acumulado</div>
              <div className={`val${ytd < 0 ? ' txt-red' : ' txt-green'}`} style={{ fontSize: 22 }}>{fmt(ytd)}</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>Jan–{MESES_LABEL[mesSel - 1]}/2026</div>
            </div>
          </div>

          {/* Tipos de despesa */}
          <div className="module-card mb">
            <div className="module-card-title">📦 Por Tipo de Despesa — {MESES_LABEL[mesSel - 1]}/2026</div>
            <div className="g3">
              {porTipo.map(t => (
                <div key={t.id} style={{ padding: 16, background: 'var(--s2)', borderRadius: 'var(--r2)', borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{t.label}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900, color: t.total < 0 ? '#f87171' : 'var(--green)' }}>
                    {fmt(t.total)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini comparativo visual */}
          <div className="module-card">
            <div className="module-card-title">📉 Evolução 4 Meses</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 100 }}>
              {meses3.map(mes => {
                const v = Math.abs(totalPorMes(mes))
                const max = Math.max(...meses3.map(m => Math.abs(totalPorMes(m))), 1)
                const h = Math.round((v / max) * 80)
                return (
                  <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{fmt(totalPorMes(mes))}</div>
                    <div style={{ width: '100%', height: h, background: mes === mesSel ? 'var(--blue)' : 'var(--s3)', borderRadius: '4px 4px 0 0', transition: 'height .4s' }}></div>
                    <div style={{ fontSize: 11, color: mes === mesSel ? 'var(--blue3)' : 'var(--tx3)', fontWeight: mes === mesSel ? 700 : 400 }}>{MESES_LABEL[mes - 1]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── POR BANCO ── */}
      {activeTab === 'bancos' && (
        <div className="module-card">
          <div className="module-card-title">🏦 Gastos por Banco — {MESES_LABEL[mesSel - 1]}/2026</div>
          {porBanco.length === 0 && <div className="empty-state"><div className="icon">🏦</div><p>Sem lançamentos no período</p></div>}
          <table className="exec-table">
            <thead><tr><th>Banco</th><th>Lançamentos</th><th>Total</th><th>Participação</th></tr></thead>
            <tbody>
              {porBanco.sort((a, b) => a.total - b.total).map(b => {
                const totalGeral = porBanco.reduce((s, x) => s + Math.abs(x.total), 0)
                const pct = totalGeral > 0 ? ((Math.abs(b.total) / totalGeral) * 100).toFixed(1) : 0
                return (
                  <tr key={b.banco}>
                    <td style={{ fontWeight: 600, color: 'var(--tx)' }}>🏦 {b.banco}</td>
                    <td>{b.qtd}</td>
                    <td style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: b.total < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(b.total)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: 'var(--s3)', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue)', borderRadius: 3 }}></div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── POR NATUREZA ── */}
      {activeTab === 'natureza' && (
        <div className="module-card">
          <div className="module-card-title">🏷 Gastos por Natureza de Despesa — {MESES_LABEL[mesSel - 1]}/2026</div>
          {porNatureza.length === 0 && <div className="empty-state"><div className="icon">🏷</div><p>Sem lançamentos no período</p></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {porNatureza.map(n => {
              const pct = maxNat > 0 ? (Math.abs(n.total) / maxNat) * 100 : 0
              return (
                <div key={n.nat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 140, fontSize: 13, fontWeight: 600, color: 'var(--tx2)', flexShrink: 0 }}>{n.nat}</div>
                  <div style={{ flex: 1, height: 22, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: 4, transition: 'width .4s' }}></div>
                  </div>
                  <div style={{ width: 90, textAlign: 'right', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>{fmt(n.total)}</div>
                  <div style={{ width: 20, textAlign: 'right', fontSize: 11, color: 'var(--tx3)', flexShrink: 0 }}>{n.qtd}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LANÇAMENTOS ── */}
      {activeTab === 'lancamentos' && (
        <div className="module-card">
          <div className="module-card-title">📋 Todos os Lançamentos</div>
          <table className="exec-table">
            <thead>
              <tr><th>Descrição</th><th>Banco</th><th>Natureza</th><th>Tipo</th><th>Empresa</th><th>Mês</th><th>Valor</th></tr>
            </thead>
            <tbody>
              {lancFiltrados.sort((a, b) => b.mes - a.mes || b.id.localeCompare(a.id)).map(l => {
                const tipo = TIPOS_DESPESA.find(t => t.id === l.tipo)
                const emp = empresas.find(e => e.id === l.empresa)
                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500, color: 'var(--tx)' }}>{l.descricao}</td>
                    <td>{l.banco}</td>
                    <td>{l.natureza}</td>
                    <td><span className="pill" style={{ background: tipo?.color + '18', color: tipo?.color, fontSize: 10 }}>{tipo?.label || l.tipo}</span></td>
                    <td>{emp ? <span className="badge" style={{ background: emp.cor + '22', color: emp.cor }}>{emp.sigla}</span> : <span style={{ color: 'var(--tx3)' }}>Geral</span>}</td>
                    <td style={{ color: 'var(--tx3)' }}>{MESES_LABEL[l.mes - 1]}/{l.ano}</td>
                    <td style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: l.valor < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(l.valor)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal novo lançamento */}
      {modalOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ width: 500 }}>
            <div className="modal-title">
              <span>💳 Novo Lançamento</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Banco</label>
                <select className="inp" value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}>
                  {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <select className="inp" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}>
                  <option value="all">Rateada (todas)</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Natureza</label>
                <select className="inp" value={form.natureza} onChange={e => setForm(f => ({ ...f, natureza: e.target.value }))}>
                  {NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Despesa</label>
                <select className="inp" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {TIPOS_DESPESA.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="inp" placeholder="Ex.: Salário equipe, Aluguel, etc." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input className="inp" type="number" placeholder="Ex.: 2500" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mês</label>
                <select className="inp" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: Number(e.target.value) }))}>
                  {MESES_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}/2026</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={saveLancamento}>Registrar Lançamento</button>
          </div>
        </div>
      )}
    </div>
  )
}
