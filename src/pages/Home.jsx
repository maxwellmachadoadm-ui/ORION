import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

const AGENDA = [
  { titulo: 'Antonio Idea BH', dia: 'QUA', num: '25', hora: '11:00 — 12:00', cor: '#3b82f6' },
  { titulo: 'Dra Julia — Consulta', dia: 'QUA', num: '25', hora: '16:30 — 17:30', cor: '#10b981' },
  { titulo: 'Stay at Nobile Suites Diamond', dia: 'DOM', num: '29', hora: 'Dia inteiro', cor: '#f59e0b' },
  { titulo: 'Reuniao CDL — Assembleia', dia: 'TER', num: '01', hora: '09:00 — 11:00', cor: '#10b981' },
]

const NEWS = [
  'Selic mantida em 10,75% — Copom sinaliza manutencao para proxima reuniao',
  'Reforma tributaria: PIS/Cofins unificados impactam prestadores de servicos medicos',
  'CFM regulamenta telemedicina — oportunidade para Doctor Wealth expandir base',
  'Credito para PME cresce 8% no trimestre — BNDES amplia linha para microempresas',
  'Mercado de eventos cresce 22% no pos-pandemia — oportunidade para Original Fotografia',
]

export default function Home() {
  const { profile } = useAuth()
  const { empresas, tarefas, checkin, saveCheckin, generateAlerts, fmt, loaded } = useData()
  const navigate = useNavigate()
  const [ci, setCi] = useState(checkin)
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveItems, setLiveItems] = useState([])

  useEffect(() => { setCi(checkin) }, [checkin])

  if (!loaded) return null

  const h = new Date().getHours()
  const greeting = h < 12 ? 'BOM DIA' : h < 18 ? 'BOA TARDE' : 'BOA NOITE'
  const firstName = (profile?.name || 'MAXWELL').split(' ')[0].toUpperCase()
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const empsAtivas = empresas.filter(e => e.id !== 'gp')
  const fatTotal = empsAtivas.reduce((s, e) => s + (e.faturamento || 0), 0)
  const resTotal = empsAtivas.reduce((s, e) => s + (e.resultado || 0), 0)
  const avgScore = Math.round(empresas.reduce((s, e) => s + (e.score || 0), 0) / (empresas.length || 1))
  const alerts = generateAlerts()

  function handleCi(field, value) {
    const next = { ...ci, [field]: value }
    setCi(next)
    saveCheckin(next)
  }

  function startLive() {
    if (liveRunning) return
    setLiveRunning(true)
    setLiveItems([])
    let idx = 0
    const iv = setInterval(() => {
      if (idx >= NEWS.length) { clearInterval(iv); return }
      const now = new Date()
      setLiveItems(prev => [{ time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'), text: NEWS[idx] }, ...prev])
      idx++
    }, 1200)
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--blue3)', fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
          {greeting}, {firstName}
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          Vamos começar a trabalhar
        </h1>
        <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>{dateStr}</div>
      </div>

      {/* KPIs */}
      <div className="g4 mb">
        <div className="card"><div className="lbl">Faturamento do Ecossistema</div><div className="val txt-blue">{fmt(fatTotal)}</div><div className="delta-up">&#9650; +8,2% vs mes anterior</div></div>
        <div className="card"><div className="lbl">Resultado Liquido</div><div className="val txt-green">{fmt(resTotal)}</div><div className="delta-up">&#9650; +12,1% vs mes anterior</div></div>
        <div className="card"><div className="lbl">Health Score Medio</div><div className="val" style={{ color: '#a78bfa' }}>{avgScore}</div><div className="delta-neu">{empresas.length} empresas ativas</div></div>
        <div className="card"><div className="lbl">Alertas Ativos</div><div className="val txt-red">{alerts.length}</div><div className="delta-neu">{alerts.filter(a => a.level === 'critico').length} criticos - {alerts.filter(a => a.level === 'atencao').length} atencao</div></div>
      </div>

      {/* Empresas */}
      <div className="slbl">Selecione uma empresa</div>
      <div className="emp-grid">
        {empresas.map(e => {
          const pct = e.meta > 0 ? Math.min(e.faturamento / e.meta * 100, 100).toFixed(0) : 0
          const crescC = e.crescimento >= 0 ? 'var(--green)' : 'var(--red)'
          const crescS = e.crescimento >= 0 ? '▲' : '▼'
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
                    <div><div className="emp-nlbl">Faturamento</div><div className="emp-nval" style={{ color: e.cor }}>{fmt(e.faturamento)}</div></div>
                    <div><div className="emp-nlbl">Margem</div><div className="emp-nval">{e.faturamento > 0 ? ((e.resultado / e.faturamento) * 100).toFixed(0) + '%' : '—'}</div></div>
                    <div><div className="emp-nlbl">vs Meta</div><div className="emp-nval" style={{ color: crescC }}>{crescS} {Math.abs(e.crescimento)}%</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx3)', marginBottom: 4 }}><span>{fmt(e.faturamento)}</span><span>Meta {fmt(e.meta)}</span></div>
                  <div className="pbar"><div className="pfill" style={{ width: pct + '%', background: e.cor }}></div></div>
                </>
              ) : (
                <div className="emp-nums">
                  <div><div className="emp-nlbl">Patrimonio</div><div className="emp-nval" style={{ color: e.cor }}>R$ 1,2M</div></div>
                  <div><div className="emp-nlbl">Renda</div><div className="emp-nval">R$ 52k/mes</div></div>
                  <div><div className="emp-nlbl">Poupanca</div><div className="emp-nval txt-green">42%</div></div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div className="flex aic gap8">
                  <div className="hring">{e.score}</div>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Health Score</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Clique para abrir →</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Agenda + Live */}
      <div className="g2 mb">
        <div className="card">
          <div className="flex aic jsb mb-sm">
            <div className="flex aic gap8">
              <span style={{ fontSize: 16 }}>📅</span>
              <div>
                <div className="lbl" style={{ margin: 0 }}>Agenda</div>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, letterSpacing: 1 }}>Google Calendar</div>
              </div>
            </div>
          </div>
          {AGENDA.map((a, i) => (
            <div key={i} className="ag-item" style={{ borderLeftColor: a.cor }}>
              <div className="ag-date">
                <div className="ag-day">{a.dia}</div>
                <div className="ag-num">{a.num}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{a.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{a.hora}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="live-header">
            <div className="live-dot"></div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--tx2)' }}>MAXXXI Live — Radar de Mercado</div>
            <button className="tb-btn" style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px' }} onClick={startLive}>▶ Iniciar</button>
          </div>
          <div>
            {liveItems.length === 0 && <div style={{ fontSize: 13, color: 'var(--tx3)', fontStyle: 'italic' }}>Clique em ▶ para o MAXXXI varrer noticias de mercado.</div>}
            {liveItems.map((item, i) => (
              <div key={i} className="feed-line">
                <span className="feed-time">{item.time}</span>{item.text}
              </div>
            ))}
          </div>
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
            <div className="lbl">O que e prioridade hoje?</div>
            <textarea rows="3" placeholder="Digite aqui..." value={ci.prioridade} onChange={e => handleCi('prioridade', e.target.value)} />
          </div>
          <div>
            <div className="lbl">Qual decisao nao pode esperar?</div>
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
      {alerts.length === 0 && <div style={{ color: 'var(--green)', fontSize: 13, padding: 12 }}>Nenhum alerta ativo — ecossistema saudavel</div>}
      {alerts.map((a, i) => (
        <div key={i} className={a.level === 'critico' ? 'alert-r' : 'alert-a'} style={{ cursor: 'pointer' }} onClick={() => navigate(`/empresa/${a.emp}`)}>
          {a.level === 'critico' ? '🔴' : '🟡'} {a.text}
        </div>
      ))}
    </>
  )
}
