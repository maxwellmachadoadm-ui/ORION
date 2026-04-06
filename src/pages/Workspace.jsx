import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'

const BASE_TABS = ['KPIs', 'OKRs', 'Tarefas', 'Contratos', 'Riscos', 'Decisoes', 'CRM', 'Arquivos']

const PRIORITY_COLORS = { alta: '#ef4444', media: '#f59e0b', baixa: '#3b82f6' }
const STATUS_LABELS = { todo: 'A Fazer', doing: 'Em Andamento', done: 'Concluida' }
const STATUS_COLORS = { todo: '#ef4444', doing: '#f59e0b', done: '#10b981' }
const CONTRATO_STATUS = { ativo: '#10b981', inadim: '#ef4444', negoc: '#f59e0b' }
const RISCO_COLORS = { alto: '#ef4444', medio: '#f59e0b', baixo: '#3b82f6' }
const CRM_FASES = ['Lead', 'Proposta', 'Negociacao', 'Fechado']
const CRM_COLORS = { Lead: '#3b82f6', Proposta: '#f59e0b', Negociacao: '#8b5cf6', Fechado: '#10b981' }

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    empresas, getEmpresa, getKpis, getOkrs, getTarefas, getContratos,
    getRiscos, getDecisoes, getCrmLeads, fmt, loaded, updateTask
  } = useData()

  const [tab, setTab] = useState('KPIs')
  const [files, setFiles] = useState([])

  const emp = getEmpresa(id)

  // Load files from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`orion_files_${id}`)
    if (saved) setFiles(JSON.parse(saved))
    else setFiles([])
  }, [id])

  if (!loaded) return <div className="loading">Carregando...</div>
  if (!emp) return <div className="page"><h1>Empresa nao encontrada</h1></div>

  const empKpis = getKpis(id)
  const empOkrs = getOkrs(id)
  const empTarefas = getTarefas(id)
  const empContratos = getContratos(id)
  const empRiscos = getRiscos(id)
  const empDecisoes = getDecisoes(id)
  const empLeads = getCrmLeads(id)

  function handleFileUpload(e) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const newFiles = []
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      const reader = new FileReader()
      reader.onload = () => {
        const entry = {
          id: Date.now().toString() + i,
          name: f.name,
          size: f.size,
          type: f.type,
          data: reader.result,
          uploaded: new Date().toISOString(),
        }
        setFiles(prev => {
          const next = [...prev, entry]
          localStorage.setItem(`orion_files_${id}`, JSON.stringify(next))
          return next
        })
      }
      reader.readAsDataURL(f)
    }
  }

  function removeFile(fileId) {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== fileId)
      localStorage.setItem(`orion_files_${id}`, JSON.stringify(next))
      return next
    })
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  function renderTabContent() {
    switch (tab) {
      case 'KPIs':
        return (
          <div className="g4">
            {empKpis.map((k, i) => (
              <div key={i} className="card kpi-card">
                <span className="kpi-icon">{k.icone}</span>
                <span className="lbl">{k.label}</span>
                <span className="val">{k.valor}</span>
              </div>
            ))}
            {empKpis.length === 0 && <p className="empty">Nenhum KPI cadastrado.</p>}
          </div>
        )

      case 'OKRs':
        return (
          <div className="okr-list">
            {empOkrs.map((o, i) => (
              <div key={i} className="card okr-card">
                <div className="okr-header">
                  <span className="okr-obj">🎯 {o.objetivo}</span>
                  <span className="okr-pct">{o.progresso}%</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${o.progresso}%`,
                      background: o.progresso >= 70 ? '#10b981' : o.progresso >= 40 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
            {empOkrs.length === 0 && <p className="empty">Nenhum OKR cadastrado.</p>}
          </div>
        )

      case 'Tarefas':
        return (
          <div className="task-list">
            {empTarefas.map(t => (
              <div key={t.id} className="card task-card" style={{ borderLeft: `4px solid ${PRIORITY_COLORS[t.prioridade] || '#666'}` }}>
                <div className="task-card-header">
                  <span className="badge" style={{ background: STATUS_COLORS[t.status] }}>
                    {STATUS_LABELS[t.status] || t.status}
                  </span>
                  <span className="badge priority-badge" style={{ background: PRIORITY_COLORS[t.prioridade] || '#666' }}>
                    {t.prioridade}
                  </span>
                </div>
                <p className="task-title">{t.titulo}</p>
                {t.descricao && <p className="task-desc">{t.descricao}</p>}
                {t.prazo && <p className="task-date">📅 {t.prazo}</p>}
                <div className="task-actions">
                  {t.status === 'todo' && (
                    <button className="btn btn-sm btn-doing" onClick={() => updateTask(t.id, { status: 'doing' })}>▶ Iniciar</button>
                  )}
                  {t.status === 'doing' && (
                    <button className="btn btn-sm btn-done" onClick={() => updateTask(t.id, { status: 'done' })}>✅ Concluir</button>
                  )}
                  {t.status === 'done' && (
                    <button className="btn btn-sm btn-reopen" onClick={() => updateTask(t.id, { status: 'todo' })}>🔄 Reabrir</button>
                  )}
                </div>
              </div>
            ))}
            {empTarefas.length === 0 && <p className="empty">Nenhuma tarefa cadastrada.</p>}
          </div>
        )

      case 'Contratos':
        return (
          <div className="contract-list">
            {empContratos.map((c, i) => (
              <div key={i} className="card contract-card">
                <div className="contract-header">
                  <strong>{c.nome}</strong>
                  <span className="badge" style={{ background: CONTRATO_STATUS[c.status] || '#666' }}>
                    {c.status === 'ativo' ? 'Ativo' : c.status === 'inadim' ? 'Inadimplente' : 'Em Negociacao'}
                  </span>
                </div>
                <div className="contract-body">
                  <span>💰 {c.valor}</span>
                  <span>📅 Vencimento: {c.vencimento}</span>
                </div>
              </div>
            ))}
            {empContratos.length === 0 && <p className="empty">Nenhum contrato cadastrado.</p>}
          </div>
        )

      case 'Riscos':
        return (
          <div className="risk-list">
            {empRiscos.map((r, i) => (
              <div key={i} className="card risk-card" style={{ borderLeft: `4px solid ${RISCO_COLORS[r.nivel] || '#666'}` }}>
                <div className="risk-header">
                  <span className="badge" style={{ background: RISCO_COLORS[r.nivel] }}>
                    {r.nivel === 'alto' ? 'Alto' : r.nivel === 'medio' ? 'Medio' : 'Baixo'}
                  </span>
                </div>
                <p>{r.descricao}</p>
              </div>
            ))}
            {empRiscos.length === 0 && <p className="empty">Nenhum risco mapeado.</p>}
          </div>
        )

      case 'Decisoes':
        return (
          <div className="decision-list">
            {empDecisoes.map((d, i) => (
              <div key={i} className="card decision-card">
                <p className="decision-text">⚡ {d.descricao}</p>
                <span className="decision-date">📅 {d.data}</span>
              </div>
            ))}
            {empDecisoes.length === 0 && <p className="empty">Nenhuma decisao registrada.</p>}
          </div>
        )

      case 'CRM':
        return (
          <div className="crm-pipeline">
            {CRM_FASES.map(fase => {
              const leads = empLeads.filter(l => l.fase === fase)
              return (
                <div key={fase} className="crm-col">
                  <div className="crm-col-header" style={{ borderBottom: `3px solid ${CRM_COLORS[fase]}` }}>
                    <h4>{fase}</h4>
                    <span className="count">{leads.length}</span>
                  </div>
                  {leads.map((l, i) => (
                    <div key={i} className="card crm-card">
                      <strong>{l.nome}</strong>
                      <span className="crm-val">{l.valor}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )

      case 'Arquivos':
        return (
          <div className="files-section">
            <div className="file-upload">
              <label className="btn btn-primary upload-btn">
                📎 Enviar Arquivo
                <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <div className="file-list">
              {files.map(f => (
                <div key={f.id} className="card file-card">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <div>
                      <strong>{f.name}</strong>
                      <small>{formatBytes(f.size)} — {new Date(f.uploaded).toLocaleDateString('pt-BR')}</small>
                    </div>
                  </div>
                  <div className="file-actions">
                    <a href={f.data} download={f.name} className="btn btn-sm btn-doing">⬇ Baixar</a>
                    <button className="btn btn-sm btn-del" onClick={() => removeFile(f.id)}>🗑</button>
                  </div>
                </div>
              ))}
              {files.length === 0 && <p className="empty">Nenhum arquivo enviado para esta empresa.</p>}
            </div>
          </div>
        )

      case 'Gestao de Fundos':
        return (
          <div style={{ margin: '-24px -28px', height: 'calc(100vh - 240px)' }}>
            <iframe
              src="/forme-seguro-v2.html"
              title="Forme Seguro — Gestao de Fundos"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '0 0 var(--r) var(--r)',
                background: '#f5f4f0',
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  const pctMeta = emp.meta > 0 ? Math.round((emp.faturamento / emp.meta) * 100) : 0

  return (
    <div className="page workspace">
      {/* Company Tabs */}
      <div className="emp-tabs">
        {empresas.map(e => (
          <button
            key={e.id}
            className={`emp-tab ${e.id === id ? 'active' : ''}`}
            style={{ borderBottom: e.id === id ? `3px solid ${e.cor}` : 'none' }}
            onClick={() => navigate(`/empresa/${e.id}`)}
          >
            <span className="emp-sigla-sm" style={{ background: e.cor }}>{e.sigla}</span>
            {e.nome}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="workspace-header" style={{ borderLeft: `4px solid ${emp.cor}` }}>
        <div className="workspace-title">
          <span className="emp-sigla" style={{ background: emp.cor }}>{emp.sigla}</span>
          <div>
            <h1>{emp.nome}</h1>
            <p className="subtitle">{emp.descricao}</p>
          </div>
        </div>
        <div className="workspace-stats">
          <div className="ws-stat">
            <span className="lbl">Faturamento</span>
            <span className="val">{fmt(emp.faturamento)}</span>
          </div>
          <div className="ws-stat">
            <span className="lbl">Resultado</span>
            <span className="val">{fmt(emp.resultado)}</span>
          </div>
          <div className="ws-stat">
            <span className="lbl">Crescimento</span>
            <span className="val" style={{ color: emp.crescimento >= 0 ? '#10b981' : '#ef4444' }}>
              {emp.crescimento > 0 ? '+' : ''}{emp.crescimento}%
            </span>
          </div>
          <div className="ws-stat">
            <span className="lbl">Score</span>
            <span className="val" style={{ color: emp.score >= 70 ? '#10b981' : emp.score >= 50 ? '#f59e0b' : '#ef4444' }}>
              {emp.score}/100
            </span>
          </div>
          {emp.meta > 0 && (
            <div className="ws-stat">
              <span className="lbl">Meta</span>
              <span className="val">{pctMeta}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {[...BASE_TABS, ...(id === 'fs' ? ['Gestao de Fundos'] : [])].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}
