import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData, safeName } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import Biblioteca from './Biblioteca'
import OriginalFotografia from './OriginalFotografia'

const BASE_TABS = ['KPIs', 'OKRs', 'Tarefas', 'Contratos', 'Riscos', 'Decisões', 'Pipeline', 'Fluxo de Caixa', 'DRE', 'Arquivos', 'Biblioteca']

// ── Componente de Projeções FS ──
function ProjecoesFS({ emp, kpis, fmt }) {
  const capitalAtual = 420000
  const turmasAtivas = 3
  const turmasPipeline = 5
  const ticketMedio = 5000
  const crescMensal = 0.08

  const meses = Array.from({ length: 12 }, (_, i) => {
    const m = new Date(2026, i, 1)
    return {
      label: m.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      capital: Math.round(capitalAtual * Math.pow(1 + crescMensal, i + 1)),
      receita: Math.round(turmasAtivas * ticketMedio * Math.pow(1 + crescMensal * 0.5, i)),
    }
  })

  const maxCapital = Math.max(...meses.map(m => m.capital))

  return (
    <div>
      <div className="g4 mb">
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Capital Projetado 12m</div>
          <div className="val txt-purple" style={{ fontSize: 22 }}>{fmt(meses[11].capital)}</div>
          <div className="delta-up">▲ +{((meses[11].capital / capitalAtual - 1) * 100).toFixed(0)}% vs hoje</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Turmas Ativas</div>
          <div className="val" style={{ fontSize: 22 }}>{turmasAtivas}</div>
          <div className="delta-neu">+ {turmasPipeline} em pipeline</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Receita Mensal Projetada</div>
          <div className="val txt-green" style={{ fontSize: 22 }}>{fmt(meses[11].receita)}</div>
          <div className="delta-up">▲ crescimento acumulado</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Ticket Médio / Turma</div>
          <div className="val txt-blue" style={{ fontSize: 22 }}>{fmt(ticketMedio)}</div>
          <div className="delta-neu">por mês</div>
        </div>
      </div>
      <div className="module-card mb">
        <div className="module-card-title">📈 Evolução do Capital Gerenciado (12 meses)</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 8 }}>
          {meses.map((m, i) => {
            const h = Math.round((m.capital / maxCapital) * 120)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{fmt(m.capital).replace('R$ ', '')}</div>
                <div style={{ width: '100%', height: h, background: `linear-gradient(to top, #8b5cf6, #a78bfa)`, borderRadius: '3px 3px 0 0', opacity: 0.85 + i * 0.01 }}></div>
                <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="module-card">
        <div className="module-card-title">📋 Projeção Detalhada Mensal</div>
        <table className="exec-table">
          <thead>
            <tr><th>Mês</th><th>Capital Projetado</th><th>Receita Estimada</th><th>Crescimento</th><th>vs Atual</th></tr>
          </thead>
          <tbody>
            {meses.map((m, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{m.label}</td>
                <td style={{ color: '#a78bfa', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{fmt(m.capital)}</td>
                <td style={{ color: 'var(--green)' }}>{fmt(m.receita)}</td>
                <td><span className="pill pill-green">+{(crescMensal * 100).toFixed(0)}% ao mês</span></td>
                <td style={{ color: 'var(--tx3)' }}>+{((m.capital / capitalAtual - 1) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Fluxo de Caixa Tab ──
function FluxoCaixaTab({ emp, getCashFlow, fmt }) {
  const [cfPeriodo, setCfPeriodo] = useState(90)
  const cf = getCashFlow(emp.id, cfPeriodo)
  const maxVal = Math.max(...cf.semanas.map(w => Math.max(w.entrada, w.saida)), 1)
  const totalEntrada = cf.semanas.reduce((s, w) => s + w.entrada, 0)
  const totalSaida = cf.semanas.reduce((s, w) => s + w.saida, 0)
  const saldoFinal = cf.semanas[cf.semanas.length - 1]?.saldo || 0

  return (
    <div>
      {cf.alertaNegativo && (
        <div className="notification-bar danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--r2)', padding: '10px 14px', marginBottom: 14, color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
          ⚠️ Saldo projetado negativo em algum período!
        </div>
      )}
      <div className="flex gap8 mb">
        {[30, 60, 90].map(d => (
          <button key={d} className={`btn btn-sm ${cfPeriodo === d ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCfPeriodo(d)}>{d} dias</button>
        ))}
      </div>
      <div className="g3 mb">
        <div className="card"><div className="lbl">Entradas Projetadas</div><div className="val txt-green">{fmt(totalEntrada)}</div></div>
        <div className="card"><div className="lbl">Saídas Projetadas</div><div className="val txt-red">{fmt(totalSaida)}</div></div>
        <div className="card">
          <div className="lbl">Saldo Final</div>
          <div className="val" style={{ color: saldoFinal >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(saldoFinal)}</div>
        </div>
      </div>
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>Entradas x Saídas por Semana</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, overflowX: 'auto' }}>
          {cf.semanas.map((s, i) => {
            const hE = Math.round((s.entrada / maxVal) * 160)
            const hS = Math.round((s.saida / maxVal) * 160)
            return (
              <div key={i} style={{ flex: 1, minWidth: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
                  <div style={{ width: 10, height: hE, background: 'var(--green)', borderRadius: '3px 3px 0 0', opacity: .8 }} title={`Entrada: ${fmt(s.entrada)}`} />
                  <div style={{ width: 10, height: hS, background: 'var(--red)', borderRadius: '3px 3px 0 0', opacity: .8 }} title={`Saída: ${fmt(s.saida)}`} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{s.semana}</div>
                <div style={{ fontSize: 9, color: s.saldo >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                  {s.saldo >= 0 ? '+' : ''}{fmt(s.saldo).replace('R$ ', '')}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap16 mt" style={{ fontSize: 11 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--green)', borderRadius: 2, marginRight: 4 }} />Entradas</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--red)', borderRadius: 2, marginRight: 4 }} />Saídas</span>
        </div>
      </div>
    </div>
  )
}

// ── DRE Tab ──
function DRETab({ emp, getDRE, fmt }) {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [mesPrev, setMesPrev] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7)
  })

  const dre = getDRE(emp.id, mes)
  const drePrev = getDRE(emp.id, mesPrev)

  const rows = [
    { label: 'Receita Bruta', key: 'receitaBruta', bold: true, indent: 0, positive: true },
    { label: '(-) Deduções / Impostos', key: 'deducoes', indent: 1, positive: false },
    { label: '(=) Receita Líquida', key: 'receitaLiquida', bold: true, indent: 0, positive: true },
    { label: '(-) Custos de Pessoal', key: 'custosDirectos', indent: 1, positive: false },
    { label: '(=) Margem Bruta', key: 'margemBruta', bold: true, indent: 0, color: true },
    { label: '(-) Despesas Operacionais', key: 'despesasOp', indent: 1, positive: false },
    { label: '(=) EBITDA', key: 'ebitda', bold: true, indent: 0, color: true },
    { label: '(=) Resultado Líquido', key: 'resultadoLiquido', bold: true, indent: 0, big: true, color: true },
  ]

  return (
    <div>
      <div className="flex gap8 mb" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="lbl" style={{ margin: 0 }}>Mês atual:</div>
        <input type="month" className="inp" style={{ width: 160 }} value={mes} onChange={e => setMes(e.target.value)} />
        <div className="lbl" style={{ margin: 0, marginLeft: 12 }}>Comparar com:</div>
        <input type="month" className="inp" style={{ width: 160 }} value={mesPrev} onChange={e => setMesPrev(e.target.value)} />
      </div>
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>
          DRE — {emp.nome} — {mes}
          <span className="status-badge info" style={{ marginLeft: 8, fontSize: 10 }}>Gerado automaticamente</span>
        </div>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Conta</th>
              <th style={{ textAlign: 'right' }}>{mes}</th>
              <th style={{ textAlign: 'right' }}>{mesPrev}</th>
              <th style={{ textAlign: 'right' }}>Variação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const val = dre[row.key] || 0
              const valPrev = drePrev[row.key] || 0
              const variacao = valPrev > 0 ? (((val - valPrev) / valPrev) * 100).toFixed(1) : '—'
              const varColor = val >= valPrev ? 'var(--green)' : 'var(--red)'
              const valColor = row.color ? (val >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--tx)'
              return (
                <tr key={row.key} style={{ borderTop: row.bold ? '1px solid rgba(255,255,255,0.1)' : undefined }}>
                  <td style={{
                    paddingLeft: row.indent ? 24 : 12,
                    fontWeight: row.bold ? 700 : 400,
                    fontFamily: row.big ? 'Syne, sans-serif' : undefined,
                    fontSize: row.big ? 15 : 13
                  }}>
                    {row.label}
                    {row.key === 'margemBruta' && <span className="status-badge" style={{ marginLeft: 8, fontSize: 9 }}>{dre.margemBrutaPct}%</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: row.bold ? 700 : 400, color: row.color ? valColor : undefined, fontFamily: row.big ? 'Syne, sans-serif' : undefined }}>
                    {fmt(Math.abs(val))}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--tx3)', fontSize: 12 }}>
                    {fmt(Math.abs(valPrev))}
                  </td>
                  <td style={{ textAlign: 'right', color: varColor, fontSize: 12 }}>
                    {variacao !== '—' ? `${val >= valPrev ? '▲' : '▼'} ${Math.abs(variacao)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--s2)', borderRadius: 'var(--r2)', display: 'flex', gap: 24 }}>
          <div>
            <div className="lbl">Margem Bruta</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: dre.margemBruta >= 0 ? 'var(--green)' : 'var(--red)' }}>{dre.margemBrutaPct}%</div>
          </div>
          <div>
            <div className="lbl">Margem Líquida</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: dre.resultadoLiquido >= 0 ? 'var(--green)' : 'var(--red)' }}>{dre.margemLiquidaPct}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pipeline Tab ──
function PipelineTab({ emp, getPipeline, fmt }) {
  const pipeline = getPipeline(emp.id)
  const maxMes = Math.max(...pipeline.meses.map(m => m.garantida + m.provavel + m.possivel), 1)

  return (
    <div>
      <div className="g4 mb">
        <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div className="lbl">Receita Garantida</div>
          <div className="val txt-green">{fmt(pipeline.garantida)}</div>
          <div className="delta-neu">Contratos ativos</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--amber)' }}>
          <div className="lbl">Receita Provável</div>
          <div className="val" style={{ color: 'var(--amber)' }}>{fmt(pipeline.provavel)}</div>
          <div className="delta-neu">Em negociação (70%)</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div className="lbl">Receita Possível</div>
          <div className="val txt-blue">{fmt(pipeline.possivel)}</div>
          <div className="delta-neu">Em proposta (40%)</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--purple)' }}>
          <div className="lbl">Total Pipeline</div>
          <div className="val" style={{ color: 'var(--purple)' }}>{fmt(pipeline.total)}</div>
          <div className="delta-neu">Próximos 3 meses</div>
        </div>
      </div>
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>Evolução do Pipeline — Próximos 3 Meses</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {pipeline.meses.map((m, i) => {
            const total = m.garantida + m.provavel + m.possivel
            const hTotal = Math.round((total / maxMes) * 160)
            const hG = Math.round((m.garantida / (total || 1)) * hTotal)
            const hP = Math.round((m.provavel / (total || 1)) * hTotal)
            const hPo = Math.max(hTotal - hG - hP, 4)
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--tx2)', fontWeight: 600, marginBottom: 8 }}>{m.mes}</div>
                <div style={{ height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ width: '70%', background: 'var(--blue)', height: hPo, borderRadius: '3px 3px 0 0', opacity: 0.6 }} title={`Possível: ${fmt(m.possivel)}`} />
                  <div style={{ width: '70%', background: 'var(--amber)', height: Math.max(hP, 4), opacity: 0.8 }} title={`Provável: ${fmt(m.provavel)}`} />
                  <div style={{ width: '70%', background: 'var(--green)', height: Math.max(hG, 4), opacity: 0.9 }} title={`Garantida: ${fmt(m.garantida)}`} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 8, fontFamily: 'Syne', fontWeight: 700 }}>{fmt(total)}</div>
              </div>
            )
          })}
        </div>
        <div className="flex gap16 mt" style={{ fontSize: 11, justifyContent: 'center' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--green)', borderRadius: 2, marginRight: 4 }} />Garantida</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--amber)', borderRadius: 2, marginRight: 4 }} />Provável</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--blue)', borderRadius: 2, marginRight: 4 }} />Possível</span>
        </div>
      </div>
    </div>
  )
}

// ── Patrimônio Tab ──
function PatrimonioTab({ getPatrimonio, savePatrimonio, fmt }) {
  const [pat, setPat] = useState(getPatrimonio())
  const [editMode, setEditMode] = useState(false)
  const [editPat, setEditPat] = useState(pat)

  const ativos = pat.imoveis + pat.investimentos + pat.participacoes + pat.veiculos + pat.previdencia
  const passivos = pat.dividas
  const liquido = ativos - passivos

  const categorias = [
    { label: 'Imóveis', key: 'imoveis', icon: '🏠', color: 'var(--blue)' },
    { label: 'Investimentos', key: 'investimentos', icon: '📈', color: 'var(--green)' },
    { label: 'Participações', key: 'participacoes', icon: '🏢', color: 'var(--purple)' },
    { label: 'Veículos', key: 'veiculos', icon: '🚗', color: 'var(--amber)' },
    { label: 'Previdência', key: 'previdencia', icon: '🏦', color: 'var(--cyan)' },
    { label: 'Dívidas', key: 'dividas', icon: '📋', color: 'var(--red)', isPassivo: true },
  ]

  const maxHist = Math.max(...(pat.historico || []).map(h => h.total), 1)

  return (
    <div>
      <div className="g3 mb">
        <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
          <div className="lbl">Total Ativos</div>
          <div className="val txt-green">{fmt(ativos)}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--red)' }}>
          <div className="lbl">Total Passivos (Dívidas)</div>
          <div className="val txt-red">{fmt(passivos)}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <div className="lbl">Patrimônio Líquido</div>
          <div className="val txt-blue">{fmt(liquido)}</div>
          <div className="delta-up">▲ Patrimônio real</div>
        </div>
      </div>
      <div className="g2 mb">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Distribuição por Categoria</div>
          {categorias.map(cat => {
            const val = pat[cat.key] || 0
            const pct = ativos > 0 ? ((val / ativos) * 100).toFixed(1) : 0
            return (
              <div key={cat.key} className="stat-row">
                <span className="stat-label">{cat.icon} {cat.label}</span>
                <div style={{ flex: 2, margin: '0 12px' }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
                <span className="stat-value" style={{ color: cat.color }}>{fmt(val)}</span>
                <span style={{ fontSize: 11, color: 'var(--tx3)', marginLeft: 8, minWidth: 36 }}>{pct}%</span>
              </div>
            )
          })}
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Evolução Patrimonial</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {(pat.historico || []).map((h, i) => {
              const height = Math.round((h.total / maxHist) * 120)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{fmt(h.total).replace('R$ ', '')}</div>
                  <div style={{ width: '100%', height, background: 'linear-gradient(to top, var(--blue2), var(--blue3))', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
                  <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{h.mes}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex aic jsb mb">
        <div className="section-title" style={{ margin: 0 }}>Detalhamento</div>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Cancelar' : '✏️ Editar'}
        </button>
      </div>
      {editMode && (
        <div className="card mb">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {categorias.map(cat => (
              <div key={cat.key}>
                <label className="form-label">{cat.icon} {cat.label}</label>
                <input type="number" className="inp" value={editPat[cat.key] || 0}
                  onChange={e => setEditPat(p => ({ ...p, [cat.key]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => {
            setPat(editPat); savePatrimonio(editPat); setEditMode(false)
          }}>Salvar Patrimônio</button>
        </div>
      )}
    </div>
  )
}

const PRIORITY_COLORS = { alta: '#ef4444', media: '#f59e0b', baixa: '#3b82f6' }
const STATUS_LABELS = { todo: 'A Fazer', doing: 'Em Andamento', done: 'Concluída' }
const STATUS_COLORS = { todo: '#ef4444', doing: '#f59e0b', done: '#10b981' }
const CONTRATO_STATUS = { ativo: '#10b981', inadim: '#ef4444', negoc: '#f59e0b' }
const RISCO_COLORS = { alto: '#ef4444', medio: '#f59e0b', baixo: '#3b82f6' }

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    empresas, getEmpresa, getKpis, getOkrs, getTarefas, getContratos,
    getRiscos, getDecisoes, fmt, loaded, updateTask,
    arquivos, addArquivo, deleteArquivo,
    getCashFlow, getDRE, getPipeline, getPatrimonio, savePatrimonio,
    DEFAULT_MODULOS, getEmpresaModulos,
  } = useData()
  const { canDelete, profile } = useAuth()

  const [tab, setTab] = useState('KPIs')
  const [files, setFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)

  const emp = getEmpresa(id)

  useEffect(() => {
    const saved = localStorage.getItem(`orion_files_${id}`)
    if (saved) setFiles(JSON.parse(saved))
    else setFiles([])
  }, [id])

  // Reset tab when switching company
  useEffect(() => { setTab('KPIs') }, [id])

  if (!loaded) return <div className="loading">Carregando...</div>
  if (!emp) return <div className="page"><h1>Empresa não encontrada</h1></div>

  const empKpis = getKpis(id)
  const empOkrs = getOkrs(id)
  const empTarefas = getTarefas(id)
  const empContratos = getContratos(id)
  const empRiscos = getRiscos(id)
  const empDecisoes = getDecisoes(id)

  // Tabs by company — filtradas pelos módulos ativos
  const modulosAtivos = emp ? getEmpresaModulos(emp.id) : DEFAULT_MODULOS

  // GP tem abas específicas enxutas
  const GP_TABS = ['Patrimônio', 'KPIs', 'OKRs', 'Tarefas', 'Fluxo de Caixa', 'Arquivos']

  let TABS
  if (id === 'gp') {
    TABS = GP_TABS.filter(t => modulosAtivos.includes(t))
  } else {
    const baseTabsFiltradas = modulosAtivos.filter(t => BASE_TABS.includes(t))
    const extraTabs = []
    if (id === 'fs') {
      if (modulosAtivos.includes('Gestão de Fundos')) extraTabs.push('Gestão de Fundos')
      if (modulosAtivos.includes('Projeções')) extraTabs.push('Projeções')
    }
    if (id === 'of' && modulosAtivos.includes('Projetos')) extraTabs.push('Projetos')
    TABS = [...baseTabsFiltradas, ...extraTabs]
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
                  <div className="progress-bar-fill"
                    style={{ width: `${o.progresso}%`, background: o.progresso >= 70 ? '#10b981' : o.progresso >= 40 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            ))}
            {empOkrs.length === 0 && <p className="empty">Nenhum OKR cadastrado.</p>}
          </div>
        )

      case 'Tarefas': {
        const taskCols = [
          { key: 'todo', label: '📋 A Fazer', color: '#ef4444' },
          { key: 'doing', label: '🔄 Em Andamento', color: '#f59e0b' },
          { key: 'done', label: '✅ Concluído', color: '#10b981' },
        ]
        return (
          <div className="kanban" style={{ display: 'flex', gap: 12 }}>
            {taskCols.map(col => {
              const colTasks = empTarefas.filter(t => t.status === col.key)
              return (
                <div key={col.key} className="kanban-col" style={{ flex: 1, minWidth: 0, borderRadius: 12, transition: 'box-shadow .2s' }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.boxShadow = '0 0 0 2px var(--gold), 0 0 20px rgba(245,158,11,.15)' }}
                  onDragLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.boxShadow = 'none'; const tid = e.dataTransfer.getData('taskId'); if (tid) updateTask(tid, { status: col.key }) }}>
                  <div className="kanban-col-header" style={{ borderBottom: `3px solid ${col.color}`, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 13 }}>{col.label}</h4>
                    <span className="count">{colTasks.length}</span>
                  </div>
                  <div style={{ padding: 8, minHeight: 80 }}>
                    {colTasks.map(t => (
                      <div key={t.id} className="card task-card" draggable
                        onDragStart={e => { e.dataTransfer.setData('taskId', t.id); e.dataTransfer.effectAllowed = 'move'; e.currentTarget.style.opacity = '0.4' }}
                        onDragEnd={e => { e.currentTarget.style.opacity = '1' }}
                        style={{ borderLeft: `4px solid ${PRIORITY_COLORS[t.prioridade] || '#666'}`, cursor: 'grab', marginBottom: 8 }}>
                        <div className="task-card-header">
                          <span className="badge priority-badge" style={{ background: PRIORITY_COLORS[t.prioridade] || '#666' }}>{t.prioridade}</span>
                        </div>
                        <p className="task-title">{t.titulo}</p>
                        {t.descricao && <p className="task-desc">{t.descricao}</p>}
                        {t.prazo && <p className="task-date">📅 {t.prazo}</p>}
                        <div className="task-actions">
                          {t.status === 'todo' && <button className="btn btn-sm btn-doing" onClick={() => updateTask(t.id, { status: 'doing' })}>▶ Iniciar</button>}
                          {t.status === 'doing' && <button className="btn btn-sm btn-done" onClick={() => updateTask(t.id, { status: 'done' })}>✅ Concluir</button>}
                          {t.status === 'done' && <button className="btn btn-sm btn-reopen" onClick={() => updateTask(t.id, { status: 'todo' })}>🔄 Reabrir</button>}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--tx3)', fontSize: 12 }}>Vazio</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      case 'Contratos':
        return (
          <div className="contract-list">
            {empContratos.map((c, i) => (
              <div key={i} className="card contract-card">
                <div className="contract-header">
                  <strong>{c.nome}</strong>
                  <span className="badge" style={{ background: CONTRATO_STATUS[c.status] || '#666' }}>
                    {c.status === 'ativo' ? 'Ativo' : c.status === 'inadim' ? 'Inadimplente' : 'Em Negociação'}
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
                    {r.nivel === 'alto' ? 'Alto' : r.nivel === 'medio' ? 'Médio' : 'Baixo'}
                  </span>
                </div>
                <p>{r.descricao}</p>
              </div>
            ))}
            {empRiscos.length === 0 && <p className="empty">Nenhum risco mapeado.</p>}
          </div>
        )

      case 'Decisões':
        return (
          <div className="decision-list">
            <div className="timeline">
              {empDecisoes.map((d, i) => (
                <div key={i} className="timeline-item card decision-card" style={{ marginBottom: 12, position: 'relative' }}>
                  <div className="timeline-dot" />
                  <div className="flex aic jsb" style={{ marginBottom: 4 }}>
                    <span className="status-badge info" style={{ fontSize: 9 }}>{d.data || d.dt || 'Sem data'}</span>
                    {d.responsavel && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>👤 {d.responsavel}</span>}
                  </div>
                  <p className="decision-text" style={{ margin: '4px 0' }}>⚡ {d.descricao}</p>
                  {d.resultado && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✅ Resultado: {d.resultado}</p>}
                </div>
              ))}
              {empDecisoes.length === 0 && <p className="empty">Nenhuma decisão registrada.</p>}
            </div>
          </div>
        )

      case 'Fluxo de Caixa':
        return getCashFlow ? <FluxoCaixaTab emp={emp} getCashFlow={getCashFlow} fmt={fmt} /> : <p className="empty">Módulo não disponível.</p>

      case 'DRE':
        return getDRE ? <DRETab emp={emp} getDRE={getDRE} fmt={fmt} /> : <p className="empty">Módulo não disponível.</p>

      case 'Pipeline':
        return getPipeline ? <PipelineTab emp={emp} getPipeline={getPipeline} fmt={fmt} /> : <p className="empty">Módulo não disponível.</p>

      case 'Patrimônio':
        return (getPatrimonio && savePatrimonio)
          ? <PatrimonioTab getPatrimonio={getPatrimonio} savePatrimonio={savePatrimonio} fmt={fmt} />
          : <p className="empty">Módulo não disponível.</p>

      case 'Arquivos': {
        const ctxFiles = (arquivos || []).filter(a => a.empresa_id === id)
        const DRIVE_FOLDERS = [
          { label: 'Financeiro / Extratos',          icon: '🏦', path: 'financeiro/extratos' },
          { label: 'Financeiro / Notas Fiscais',     icon: '🧾', path: 'financeiro/notas-fiscais' },
          { label: 'Financeiro / Relatórios',        icon: '📊', path: 'financeiro/relatorios' },
          { label: 'Jurídico / Contratos',           icon: '📄', path: 'juridico/contratos' },
          { label: 'Operacional / Documentos',       icon: '📋', path: 'operacional/documentos' },
          { label: 'Biblioteca / Estatutos e Manuais', icon: '📚', path: 'biblioteca/estatutos' },
        ]
        const folderFiles = currentFolder
          ? files.filter(f => f.folder === currentFolder)
          : []
        const allFolderFiles = files.filter(f => f.folder)

        return (
          <div className="files-section">
            {/* Breadcrumb */}
            {currentFolder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => setCurrentFolder(null)}>← Voltar</button>
                <span style={{ color: 'var(--tx3)' }}>📁</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{DRIVE_FOLDERS.find(f => f.path === currentFolder)?.label || currentFolder}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 11 }}>({folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Grid de pastas */}
            {!currentFolder && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Pastas da Empresa</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 20 }}>
                  {DRIVE_FOLDERS.map(f => {
                    const count = files.filter(fl => fl.folder === f.path).length
                    return (
                      <div key={f.path}
                        className="card" style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: '.15s' }}
                        onClick={() => setCurrentFolder(f.path)}>
                        <div style={{ fontSize: 24 }}>{f.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{count} arquivo{count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Upload */}
            <div className="file-upload" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <label className="btn btn-primary upload-btn">
                📎 Enviar Arquivo{currentFolder ? ` para ${DRIVE_FOLDERS.find(f => f.path === currentFolder)?.label || currentFolder}` : ''}
                <input type="file" multiple onChange={e => {
                  const fileList = e.target.files
                  if (!fileList || fileList.length === 0) return
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
                        folder: currentFolder || 'operacional/documentos',
                        uploaded: new Date().toISOString(),
                        uploaded_by: profile?.name || 'Admin',
                      }
                      setFiles(prev => {
                        const next = [...prev, entry]
                        localStorage.setItem(`orion_files_${id}`, JSON.stringify(next))
                        return next
                      })
                    }
                    reader.readAsDataURL(f)
                  }
                }} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Arquivo Digital (classificados pelo MAXXXI) */}
            {ctxFiles.length > 0 && !currentFolder && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Arquivo Digital</div>
                {ctxFiles.map(arq => (
                  <div key={arq.id} className="file-item-v4">
                    <div className="file-icon-v4">📄</div>
                    <div className="file-meta-v4">
                      <div className="file-name-v4">{arq.nome}</div>
                      <div className="file-size-v4">{arq.mes_competencia || ''} · {arq.categoria || 'não classificado'}</div>
                    </div>
                    <span className={`status-badge ${arq.status === 'aprovado' ? 'success' : 'warning'}`}>{arq.status}</span>
                    {canDelete
                      ? <button className="btn btn-icon" style={{ color: 'var(--red)', fontSize: 13 }} onClick={() => deleteArquivo(arq.id)}>🗑</button>
                      : <button className="btn btn-icon" style={{ color: 'var(--tx3)', fontSize: 13, cursor: 'default' }} disabled>🔒</button>
                    }
                  </div>
                ))}
              </div>
            )}

            {/* Arquivos na pasta selecionada */}
            {currentFolder && (
              <div className="file-list">
                {folderFiles.map(f => (
                  <div key={f.id} className="card file-card">
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <div>
                        <strong>{f.name}</strong>
                        <small>{formatBytes(f.size)} — {new Date(f.uploaded).toLocaleDateString('pt-BR')} — {f.uploaded_by || '—'}</small>
                      </div>
                    </div>
                    <div className="file-actions">
                      <a href={f.data} download={f.name} className="btn btn-sm btn-doing">⬇ Baixar</a>
                      <select className="btn btn-sm btn-secondary" style={{ fontSize: 11, padding: '2px 6px' }}
                        value={f.folder}
                        onChange={ev => {
                          setFiles(prev => {
                            const next = prev.map(x => x.id === f.id ? { ...x, folder: ev.target.value } : x)
                            localStorage.setItem(`orion_files_${id}`, JSON.stringify(next))
                            return next
                          })
                        }}>
                        {DRIVE_FOLDERS.map(df => <option key={df.path} value={df.path}>{df.label}</option>)}
                      </select>
                      {canDelete
                        ? <button className="btn btn-sm btn-del" onClick={() => removeFile(f.id)}>🗑</button>
                        : <button className="btn btn-sm" style={{ color: 'var(--tx3)', cursor: 'default' }} disabled>🔒</button>
                      }
                    </div>
                  </div>
                ))}
                {folderFiles.length === 0 && <p className="empty">Nenhum arquivo nesta pasta.</p>}
              </div>
            )}

            {/* Arquivos sem pasta (legado) */}
            {!currentFolder && files.filter(f => !f.folder).length > 0 && (
              <div className="file-list">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Arquivos Gerais</div>
                {files.filter(f => !f.folder).map(f => (
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
                      {canDelete
                        ? <button className="btn btn-sm btn-del" onClick={() => removeFile(f.id)}>🗑</button>
                        : <button className="btn btn-sm" style={{ color: 'var(--tx3)', cursor: 'default' }} disabled>🔒</button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && ctxFiles.length === 0 && !currentFolder && <p className="empty">Nenhum arquivo enviado para esta empresa.</p>}
          </div>
        )
      }

      case 'Biblioteca':
        return <Biblioteca empresaId={id} />

      case 'Projetos':
        return <OriginalFotografia />

      case 'Gestão de Fundos':
        return (
          <div style={{ margin: '-24px -28px', height: 'calc(100vh - 240px)' }}>
            <iframe src="/forme-seguro-v2.html" title="Forme Seguro — Gestão de Fundos"
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 var(--r) var(--r)', background: 'var(--bg)' }} />
          </div>
        )

      case 'Projeções':
        return (
          <div style={{ margin: '-24px -28px', height: 'calc(100vh - 240px)' }}>
            <iframe src="/projecao-forme-seguro.html" title="Forme Seguro — Projeções"
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 var(--r) var(--r)', background: 'var(--bg)' }} />
          </div>
        )

      default:
        return null
    }
  }

  const pctMeta = emp.meta > 0 ? Math.round((emp.faturamento / emp.meta) * 100) : 0

  return (
    <div className="page workspace">
      <div className="workspace-header" style={{ borderLeft: `4px solid ${emp.cor}` }}>
        <div className="workspace-title">
          <span className="emp-sigla" style={{ background: emp.cor }}>{emp.sigla}</span>
          <div>
            <h1>{safeName(emp.nome)}</h1>
            <p className="subtitle">{emp.descricao}</p>
          </div>
        </div>
        <div className="workspace-stats">
          <div className="ws-stat"><span className="lbl">Faturamento</span><span className="val">{fmt(emp.faturamento)}</span></div>
          <div className="ws-stat"><span className="lbl">Resultado</span><span className="val">{fmt(emp.resultado)}</span></div>
          <div className="ws-stat">
            <span className="lbl">Crescimento</span>
            <span className="val" style={{ color: (emp.crescimento || 0) >= 0 ? '#10b981' : '#ef4444' }}>
              {emp.crescimento != null && isFinite(emp.crescimento)
                ? `${emp.crescimento > 0 ? '+' : ''}${emp.crescimento}%`
                : '—'}
            </span>
          </div>
          <div className="ws-stat">
            <span className="lbl">Score</span>
            <span className="val" style={{ color: emp.score >= 70 ? '#10b981' : emp.score >= 50 ? '#f59e0b' : '#ef4444' }}>
              {emp.score}/100
            </span>
          </div>
          {emp.meta > 0 && (
            <div className="ws-stat"><span className="lbl">Meta</span><span className="val">{pctMeta}%</span></div>
          )}
        </div>
      </div>

      <div className="tab-nav" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}
