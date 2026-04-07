import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useApp } from '../contexts/AppContext'

const BRIEFING_ITEMS = [
  { icon: '📊', text: 'Doctor Wealth: faturamento R$ 38k/mês, meta 63% atingida, 3 reuniões agendadas.' },
  { icon: '⚠️', text: 'Original Fotografia: inadimplência em 8,7% — ação necessária.' },
  { icon: '🚀', text: 'Forme Seguro: pipeline de 5 turmas em negociação, fechar mês forte.' },
  { icon: '✅', text: 'CDL ITAPERUNA: score 88/100 — ecossistema mais estável do portfólio.' },
  { icon: '🎯', text: 'Hoje: 3 tarefas de alta prioridade em aberto. Revisar antes das 12h.' },
]

const TIPO_CORES = {
  reuniao: 'var(--blue)',
  consultoria: 'var(--purple)',
  financeiro: 'var(--green)',
  outro: 'var(--amber)',
}

export default function Home() {
  const { empresas, tarefas, checkin, saveCheckin, generateAlertsV5, generateAlerts, fmt, loaded, agenda, addAgendaItem, removeAgendaItem } = useData()
  const { presentationMode } = useApp()
  const navigate = useNavigate()
  const [ci, setCi] = useState(checkin)
  const [agendaModal, setAgendaModal] = useState(false)
  const [newItem, setNewItem] = useState({ titulo: '', data: '', hora: '', tipo: 'reuniao', empresa: '' })

  useEffect(() => { setCi(checkin) }, [checkin])

  if (!loaded) return null

  const hoje = new Date().toISOString().slice(0, 10)
  const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const empsAtivas = empresas.filter(e => e.id !== 'gp')
  const fatTotal = empsAtivas.reduce((s, e) => s + (e.faturamento || 0), 0)
  const resTotal = empsAtivas.reduce((s, e) => s + (e.resultado || 0), 0)
  const avgScore = Math.round(empresas.reduce((s, e) => s + (e.score || 0), 0) / (empresas.length || 1))
  const scoreColor = avgScore >= 70 ? 'var(--green)' : avgScore >= 40 ? 'var(--amber)' : 'var(--red)'
  const alerts = generateAlertsV5 ? generateAlertsV5() : generateAlerts()

  function handleCi(field, value) {
    const next = { ...ci, [field]: value }
    setCi(next)
    saveCheckin(next)
  }

  function getAgendaBadge(data) {
    if (data === hoje) return <span className="agenda-badge-hoje">HOJE</span>
    if (data === amanha) return <span className="agenda-badge-amanha">AMANHÃ</span>
    return <span className="agenda-badge-futuro">{new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
  }

  function handleAddAgenda(e) {
    e.preventDefault()
    if (!newItem.titulo || !newItem.data) return
    addAgendaItem(newItem)
    setNewItem({ titulo: '', data: '', hora: '', tipo: 'reuniao', empresa: '' })
    setAgendaModal(false)
  }

  const agendaOrdenada = [...(agenda || [])].sort((a, b) => a.data.localeCompare(b.data))

  return (
    <>
      {presentationMode && (
        <div className="presentation-banner">
          🔒 MODO APRESENTAÇÃO — valores sensíveis ocultos
        </div>
      )}

      {/* KPIs */}
      <div className="g4 mb">
        <div className="card">
          <div className="lbl">Faturamento do Ecossistema</div>
          <div className="val txt-blue">{presentationMode ? '••••' : fmt(fatTotal)}</div>
          <div className="delta-up">&#9650; +8,2% vs mês anterior</div>
        </div>
        <div className="card">
          <div className="lbl">Resultado Líquido</div>
          <div className="val txt-green">{presentationMode ? '••••' : fmt(resTotal)}</div>
          <div className="delta-up">&#9650; +12,1% vs mês anterior</div>
        </div>
        <div className="card">
          <div className="lbl">Health Score Médio</div>
          <div className="val" style={{ color: scoreColor }}>{avgScore}</div>
          <div className="delta-neu">{empresas.length} empresas ativas</div>
        </div>
        <div className="card">
          <div className="lbl">Alertas Ativos</div>
          <div className="val txt-red">{alerts.length}</div>
          <div className="delta-neu">{alerts.filter(a => a.level === 'critico').length} críticos · {alerts.filter(a => a.level === 'atencao').length} atenção</div>
        </div>
      </div>

      {/* Empresas */}
      <div className="slbl">Selecione uma empresa</div>
      <div className="emp-grid">
        {empresas.map(e => {
          const pct = e.meta > 0 ? Math.min(e.faturamento / e.meta * 100, 100).toFixed(0) : 0
          const crescC = e.crescimento >= 0 ? 'var(--green)' : 'var(--red)'
          const crescS = e.crescimento >= 0 ? '▲' : '▼'
          const scoreColor = e.score >= 70 ? 'var(--green)' : e.score >= 40 ? 'var(--amber)' : 'var(--red)'
          return (
            <div key={e.id} className="emp-card" onClick={() => navigate(`/empresa/${e.id}`)}
              style={{ '--emp-c': e.cor, '--emp-rgb': e.rgb }}>
              <div className="emp-top"></div>
              <div className="emp-header">
                <div className="flex aic gap12">
                  <div className="emp-sig">{e.sigla}</div>
                  <div><div className="emp-name">{e.nome}</div><div className="emp-desc">{e.descricao}</div></div>
                </div>
                <span className="stag" style={{ color: e.status_cor, background: e.status_cor + '18' }}>{e.status}</span>
              </div>
              {e.id !== 'gp' ? (
                <>
                  <div className="emp-nums">
                    <div><div className="emp-nlbl">Faturamento</div><div className="emp-nval" style={{ color: e.cor }}>{presentationMode ? '••••' : fmt(e.faturamento)}</div></div>
                    <div><div className="emp-nlbl">Margem</div><div className="emp-nval">{e.faturamento > 0 ? ((e.resultado / e.faturamento) * 100).toFixed(0) + '%' : '—'}</div></div>
                    <div><div className="emp-nlbl">vs Meta</div><div className="emp-nval" style={{ color: crescC }}>{crescS} {Math.abs(e.crescimento)}%</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx3)', marginBottom: 4 }}>
                    <span>{presentationMode ? '••••' : fmt(e.faturamento)}</span>
                    <span>Meta {presentationMode ? '••••' : fmt(e.meta)}</span>
                  </div>
                  <div className="pbar"><div className="pfill" style={{ width: pct + '%', background: e.cor }}></div></div>
                </>
              ) : (
                <div className="emp-nums">
                  <div><div className="emp-nlbl">Patrimônio</div><div className="emp-nval" style={{ color: e.cor }}>{presentationMode ? '••••' : 'R$ 1,2M'}</div></div>
                  <div><div className="emp-nlbl">Renda</div><div className="emp-nval">{presentationMode ? '••••' : 'R$ 52k/mês'}</div></div>
                  <div><div className="emp-nlbl">Poupança</div><div className="emp-nval txt-green">42%</div></div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div className="flex aic gap8">
                  <div className="hring" style={{ borderColor: scoreColor, color: scoreColor }}>{e.score}</div>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Health Score</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Clique para abrir →</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Agenda Manual + Briefing */}
      <div className="g2 mb">
        {/* Agenda */}
        <div className="card">
          <div className="flex aic jsb mb-sm">
            <div className="flex aic gap8">
              <span style={{ fontSize: 16 }}>📅</span>
              <div>
                <div className="lbl" style={{ margin: 0 }}>Agenda</div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, letterSpacing: 1 }}>Compromissos</div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setAgendaModal(true)}>+ Adicionar</button>
          </div>
          {agendaOrdenada.length === 0 && <p className="empty">Nenhum compromisso agendado.</p>}
          {agendaOrdenada.map((a) => (
            <div key={a.id} className="agenda-item" style={{ borderLeftColor: TIPO_CORES[a.tipo] || 'var(--blue)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {getAgendaBadge(a.data)}
                  {a.empresa && (
                    <span style={{ fontSize: 10, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: 1 }}>{a.empresa}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{a.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{a.hora}</div>
              </div>
              <button onClick={() => removeAgendaItem(a.id)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} title="Remover">×</button>
            </div>
          ))}
        </div>

        {/* Briefing Diário */}
        <div className="card">
          <div className="flex aic gap8" style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <div>
              <div className="lbl" style={{ margin: 0 }}>Briefing Diário</div>
              <div style={{ fontSize: 11, color: 'var(--blue3)', fontWeight: 600, letterSpacing: 1 }}>MAXXXI — Inteligência Executiva</div>
            </div>
          </div>
          {BRIEFING_ITEMS.map((item, i) => (
            <div key={i} className="briefing-item">
              <span className="briefing-icon">{item.icon}</span>
              <span className="briefing-text">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Check-in */}
      <div className="checkin mb">
        <div className="flex aic gap12" style={{ marginBottom: 14 }}>
          <div className="checkin-bar"></div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--tx3)', textTransform: 'uppercase' }}>Check-in do Dia</div>
            <div style={{ fontSize: 12, color: 'var(--blue3)', fontWeight: 600 }}>{dateStr}</div>
          </div>
        </div>
        <div className="g3">
          <div>
            <div className="lbl">O que é prioridade hoje?</div>
            <textarea rows="3" placeholder="Digite aqui..." value={ci.prioridade} onChange={e => handleCi('prioridade', e.target.value)} />
          </div>
          <div>
            <div className="lbl">Qual decisão não pode esperar?</div>
            <textarea rows="3" placeholder="Digite aqui..." value={ci.decisao} onChange={e => handleCi('decisao', e.target.value)} />
          </div>
          <div>
            <div className="lbl">Que resultado vou entregar hoje?</div>
            <textarea rows="3" placeholder="Digite aqui..." value={ci.resultado} onChange={e => handleCi('resultado', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="slbl">Central de Alertas</div>
      {alerts.length === 0 && <div style={{ color: 'var(--green)', fontSize: 13, padding: 12 }}>Nenhum alerta ativo — ecossistema saudável</div>}
      {alerts.map((a, i) => (
        <div key={i} className={a.level === 'critico' ? 'alert-r' : 'alert-a'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate(`/empresa/${a.emp}`)}>
          {a.level === 'critico' ? '🔴' : '🟡'} {a.text}
          {a.tipo && <span style={{ fontSize: 10, color: 'var(--tx3)', marginLeft: 'auto' }}>{a.tipo}</span>}
        </div>
      ))}

      {/* Modal Agenda */}
      {agendaModal && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setAgendaModal(false)}>
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-title">
              <span>📅 Novo Compromisso</span>
              <button className="modal-close" onClick={() => setAgendaModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddAgenda}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="inp" type="text" required placeholder="Título do compromisso" value={newItem.titulo}
                  onChange={e => setNewItem(p => ({ ...p, titulo: e.target.value }))} />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input className="inp" type="date" required value={newItem.data}
                    onChange={e => setNewItem(p => ({ ...p, data: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input className="inp" type="time" value={newItem.hora}
                    onChange={e => setNewItem(p => ({ ...p, hora: e.target.value }))} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="inp" value={newItem.tipo} onChange={e => setNewItem(p => ({ ...p, tipo: e.target.value }))}>
                    <option value="reuniao">Reunião</option>
                    <option value="consultoria">Consultoria</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa (opcional)</label>
                  <select className="inp" value={newItem.empresa} onChange={e => setNewItem(p => ({ ...p, empresa: e.target.value }))}>
                    <option value="">— Nenhuma —</option>
                    <option value="dw">Doctor Wealth</option>
                    <option value="of">Original Fotografia</option>
                    <option value="fs">Forme Seguro</option>
                    <option value="cdl">CDL ITAPERUNA</option>
                    <option value="gp">Gestão Pessoal</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Adicionar Compromisso</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
