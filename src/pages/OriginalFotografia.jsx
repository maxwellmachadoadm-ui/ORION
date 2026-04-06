// Módulo específico da Original Fotografia — Projetos de formatura, inadimplência e rentabilidade
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const REGIOES = ['Divinópolis', 'BH', 'Contagem', 'Betim', 'Varginha', 'Juiz de Fora', 'Uberlândia']
const ANOS_PROJETO = [1, 2, 3, 4, 5, 6]
const MIX_PAGAMENTO = ['À Vista', 'Parcelado 12x', 'Parcelado 24x', 'Parcelado 48x', 'Financiado']

const DEMO_PROJETOS = [
  { id: '1', turma: 'Medicina UFMG 2028', regiao: 'BH', duracao: 4, ano_inicio: 2024, valor_total: 85000, adimplentes: 38, total_alunos: 42, mix: 'Parcelado 24x', receita_mensal: 3542, status: 'ativo' },
  { id: '2', turma: 'Direito PUC Minas 2027', regiao: 'BH', duracao: 3, ano_inicio: 2024, valor_total: 52000, adimplentes: 25, total_alunos: 28, mix: 'Parcelado 12x', receita_mensal: 4333, status: 'ativo' },
  { id: '3', turma: 'Engenharia CEFET 2026', regiao: 'Contagem', duracao: 2, ano_inicio: 2024, valor_total: 34000, adimplentes: 30, total_alunos: 32, mix: 'À Vista', receita_mensal: 2833, status: 'ativo' },
  { id: '4', turma: 'Enfermagem UEMG 2027', regiao: 'Divinópolis', duracao: 3, ano_inicio: 2024, valor_total: 28000, adimplentes: 18, total_alunos: 22, mix: 'Parcelado 24x', receita_mensal: 1556, status: 'ativo' },
  { id: '5', turma: 'Medicina UNIFENAS 2030', regiao: 'Varginha', duracao: 6, ano_inicio: 2024, valor_total: 120000, adimplentes: 45, total_alunos: 50, mix: 'Parcelado 48x', receita_mensal: 2500, status: 'pipeline' },
  { id: '6', turma: 'Odonto UFU 2029', regiao: 'Uberlândia', duracao: 5, ano_inicio: 2024, valor_total: 95000, adimplentes: 0, total_alunos: 40, mix: 'Financiado', receita_mensal: 1979, status: 'pipeline' },
  { id: '7', turma: 'Farmácia UFVJM 2027', regiao: 'Diamantina', duracao: 3, ano_inicio: 2023, valor_total: 31000, adimplentes: 20, total_alunos: 25, mix: 'Parcelado 12x', receita_mensal: 1033, status: 'encerrado' },
]

function fmt(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1000000) return 'R$ ' + (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(0) + 'k'
  return 'R$ ' + Number(v).toLocaleString('pt-BR')
}

function StatusPill({ s }) {
  const m = { ativo: ['pill-green', 'Ativo'], pipeline: ['pill-blue', 'Pipeline'], encerrado: ['pill-gray', 'Encerrado'] }
  const [cls, label] = m[s] || ['pill-gray', s]
  return <span className={`pill ${cls}`}>{label}</span>
}

export default function OriginalFotografia() {
  const { logAction } = useAuth()
  const [tab, setTab] = useState('projetos')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegiao, setFilterRegiao] = useState('all')
  const [projetos, setProjetos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_of_projetos') || JSON.stringify(DEMO_PROJETOS)) }
    catch { return DEMO_PROJETOS }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [formProj, setFormProj] = useState({ turma: '', regiao: 'Divinópolis', duracao: 2, ano_inicio: 2024, valor_total: '', adimplentes: 0, total_alunos: 0, mix: 'Parcelado 24x', receita_mensal: 0, status: 'ativo' })

  const projetosFiltrados = projetos.filter(p =>
    (filterStatus === 'all' || p.status === filterStatus) &&
    (filterRegiao === 'all' || p.regiao === filterRegiao)
  )

  const projetosAtivos = projetos.filter(p => p.status === 'ativo')
  const fatTotal = projetosAtivos.reduce((s, p) => s + (p.receita_mensal || 0), 0)
  const inadTotal = projetosAtivos.reduce((s, p) => s + (p.total_alunos - p.adimplentes), 0)
  const alunosTotal = projetosAtivos.reduce((s, p) => s + p.total_alunos, 0)
  const inadPct = alunosTotal > 0 ? ((inadTotal / alunosTotal) * 100).toFixed(1) : 0

  function saveProj() {
    const p = { ...formProj, id: Date.now().toString(), receita_mensal: Math.round(formProj.valor_total / (formProj.duracao * 12)) }
    const next = [p, ...projetos]
    setProjetos(next)
    localStorage.setItem('orion_of_projetos', JSON.stringify(next))
    logAction('OF_PROJETO_CRIADO', `${p.turma} — ${p.regiao} — ${p.duracao} anos`)
    setModalOpen(false)
  }

  // Ranking por rentabilidade
  const ranking = [...projetosAtivos].sort((a, b) => {
    const rentA = a.adimplentes / a.total_alunos
    const rentB = b.adimplentes / b.total_alunos
    return rentB - rentA
  })

  // Por região
  const porRegiao = [...new Set(projetos.map(p => p.regiao))].map(reg => ({
    regiao: reg,
    projetos: projetos.filter(p => p.regiao === reg).length,
    receita: projetos.filter(p => p.regiao === reg && p.status === 'ativo').reduce((s, p) => s + p.receita_mensal, 0),
    inadpct: (() => {
      const ativos = projetos.filter(p => p.regiao === reg && p.status === 'ativo')
      const tot = ativos.reduce((s, p) => s + p.total_alunos, 0)
      const inad = ativos.reduce((s, p) => s + (p.total_alunos - p.adimplentes), 0)
      return tot > 0 ? ((inad / tot) * 100).toFixed(1) : 0
    })(),
  })).sort((a, b) => b.receita - a.receita)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Original Fotografia — Projetos</h1>
          <p>Gestão de projetos de formatura: rentabilidade, inadimplência e análise regional</p>
        </div>
        <button className="btn btn-blue" onClick={() => setModalOpen(true)}>+ Novo Projeto</button>
      </div>

      {/* KPIs */}
      <div className="g4 mb">
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Projetos Ativos</div>
          <div className="val txt-amber" style={{ fontSize: 28 }}>{projetosAtivos.length}</div>
          <div className="delta-neu">{projetos.filter(p => p.status === 'pipeline').length} em pipeline</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Receita Mensal Consolidada</div>
          <div className="val txt-green" style={{ fontSize: 28 }}>{fmt(fatTotal)}</div>
          <div className="delta-up">projetos ativos</div>
        </div>
        <div className="module-card" style={{ padding: 16, borderTop: inadPct > 5 ? '3px solid var(--red)' : '3px solid var(--green)' }}>
          <div className="lbl">Inadimplência Geral</div>
          <div className={`val ${inadPct > 5 ? 'txt-red' : 'txt-green'}`} style={{ fontSize: 28 }}>{inadPct}%</div>
          <div className="delta-neu">{inadTotal} de {alunosTotal} alunos</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Ticket Médio / Projeto</div>
          <div className="val" style={{ fontSize: 28 }}>{projetosAtivos.length > 0 ? fmt(Math.round(fatTotal / projetosAtivos.length)) : '—'}</div>
          <div className="delta-neu">por mês</div>
        </div>
      </div>

      <div className="tabs mb">
        {['projetos', 'regioes', 'ranking', 'mix'].map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {{ projetos: '📁 Projetos', regioes: '🗺 Por Região', ranking: '🏆 Ranking', mix: '💳 Mix Pagamento' }[t]}
          </button>
        ))}
      </div>

      {/* ── PROJETOS ── */}
      {tab === 'projetos' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'ativo', 'pipeline', 'encerrado'].map(s => (
              <button key={s} className={`btn${filterStatus === s ? ' btn-blue' : ''}`} onClick={() => setFilterStatus(s)}>
                {s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <select className="inp" style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
              value={filterRegiao} onChange={e => setFilterRegiao(e.target.value)}>
              <option value="all">Todas as regiões</option>
              {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="module-card">
            <table className="exec-table">
              <thead>
                <tr><th>Turma</th><th>Região</th><th>Duração</th><th>Alunos</th><th>Inadimplência</th><th>Mix</th><th>Receita/mês</th><th>Status</th></tr>
              </thead>
              <tbody>
                {projetosFiltrados.map(p => {
                  const inadPctP = p.total_alunos > 0 ? (((p.total_alunos - p.adimplentes) / p.total_alunos) * 100).toFixed(1) : 0
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--tx)' }}>{p.turma}</td>
                      <td style={{ color: 'var(--tx3)' }}>{p.regiao}</td>
                      <td style={{ textAlign: 'center' }}>{p.duracao} {p.duracao === 1 ? 'ano' : 'anos'}</td>
                      <td style={{ textAlign: 'center' }}>{p.adimplentes}/{p.total_alunos}</td>
                      <td>
                        <span className={`pill ${inadPctP > 5 ? 'pill-red' : 'pill-green'}`}>{inadPctP}%</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--tx3)' }}>{p.mix}</td>
                      <td style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: 'var(--green)' }}>{fmt(p.receita_mensal)}</td>
                      <td><StatusPill s={p.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── REGIÕES ── */}
      {tab === 'regioes' && (
        <div className="module-card">
          <div className="module-card-title">🗺 Análise por Região</div>
          <table className="exec-table">
            <thead>
              <tr><th>Região</th><th>Projetos</th><th>Receita/mês</th><th>Inadimplência</th><th>Performance</th></tr>
            </thead>
            <tbody>
              {porRegiao.map(r => (
                <tr key={r.regiao}>
                  <td style={{ fontWeight: 600, color: 'var(--tx)' }}>📍 {r.regiao}</td>
                  <td style={{ textAlign: 'center' }}>{r.projetos}</td>
                  <td style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: 'var(--green)' }}>{fmt(r.receita)}</td>
                  <td><span className={`pill ${r.inadpct > 5 ? 'pill-red' : 'pill-green'}`}>{r.inadpct}%</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: 'var(--s3)', borderRadius: 3 }}>
                        <div style={{ width: `${Math.min((r.receita / fatTotal) * 100, 100)}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{fatTotal > 0 ? ((r.receita / fatTotal) * 100).toFixed(0) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RANKING ── */}
      {tab === 'ranking' && (
        <div className="module-card">
          <div className="module-card-title">🏆 Ranking de Projetos por Rentabilidade (adimplência + receita)</div>
          {ranking.map((p, idx) => {
            const adimPct = p.total_alunos > 0 ? ((p.adimplentes / p.total_alunos) * 100) : 0
            const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}°`
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--br)' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, width: 36, textAlign: 'center', flexShrink: 0 }}>{medal}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{p.turma}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{p.regiao} · {p.duracao} anos · {p.mix}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{fmt(p.receita_mensal)}/mês</div>
                  <div style={{ fontSize: 11, color: adimPct >= 90 ? 'var(--green)' : adimPct >= 75 ? 'var(--amber)' : 'var(--red)' }}>
                    {adimPct.toFixed(0)}% adimplente
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MIX DE PAGAMENTO ── */}
      {tab === 'mix' && (
        <div className="module-card">
          <div className="module-card-title">💳 Mix de Pagamento por Turma</div>
          {(() => {
            const mixCount = {}
            projetos.filter(p => p.status === 'ativo').forEach(p => { mixCount[p.mix] = (mixCount[p.mix] || 0) + 1 })
            const total = Object.values(mixCount).reduce((s, v) => s + v, 0)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {Object.entries(mixCount).sort((a, b) => b[1] - a[1]).map(([mix, cnt]) => (
                  <div key={mix} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 160, fontSize: 13, fontWeight: 600 }}>{mix}</div>
                    <div style={{ flex: 1, height: 24, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(cnt / total) * 100}%`, height: '100%', background: 'linear-gradient(90deg,var(--amber),#fbbf24)', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>{cnt}</span>
                      </div>
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: 12, color: 'var(--tx3)' }}>{((cnt / total) * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )
          })()}

          <div className="module-card-title" style={{ marginTop: 8 }}>📊 Inadimplência por Turma e Região</div>
          <table className="exec-table">
            <thead>
              <tr><th>Turma</th><th>Região</th><th>Mix</th><th>Adimplentes</th><th>Inadimplentes</th><th>Taxa</th></tr>
            </thead>
            <tbody>
              {projetos.filter(p => p.status === 'ativo').map(p => {
                const inad = p.total_alunos - p.adimplentes
                const pct = p.total_alunos > 0 ? ((inad / p.total_alunos) * 100).toFixed(1) : 0
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.turma}</td>
                    <td>{p.regiao}</td>
                    <td style={{ fontSize: 12, color: 'var(--tx3)' }}>{p.mix}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{p.adimplentes}</td>
                    <td style={{ color: inad > 0 ? 'var(--red)' : 'var(--tx3)', fontWeight: inad > 0 ? 700 : 400 }}>{inad}</td>
                    <td><span className={`pill ${pct > 5 ? 'pill-red' : 'pill-green'}`}>{pct}%</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal novo projeto */}
      {modalOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ width: 480 }}>
            <div className="modal-title">
              <span>📷 Novo Projeto OF</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Nome da Turma *</label>
              <input className="inp" placeholder="Ex.: Medicina UFMG 2030" value={formProj.turma} onChange={e => setFormProj(f => ({ ...f, turma: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Região</label>
                <select className="inp" value={formProj.regiao} onChange={e => setFormProj(f => ({ ...f, regiao: e.target.value }))}>
                  {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duração (anos)</label>
                <select className="inp" value={formProj.duracao} onChange={e => setFormProj(f => ({ ...f, duracao: Number(e.target.value) }))}>
                  {ANOS_PROJETO.map(a => <option key={a} value={a}>{a} {a === 1 ? 'ano' : 'anos'}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total de Alunos</label>
                <input className="inp" type="number" placeholder="Ex.: 40" value={formProj.total_alunos} onChange={e => setFormProj(f => ({ ...f, total_alunos: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor Total do Contrato</label>
                <input className="inp" type="number" placeholder="Ex.: 80000" value={formProj.valor_total} onChange={e => setFormProj(f => ({ ...f, valor_total: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mix de Pagamento</label>
                <select className="inp" value={formProj.mix} onChange={e => setFormProj(f => ({ ...f, mix: e.target.value }))}>
                  {MIX_PAGAMENTO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="inp" value={formProj.status} onChange={e => setFormProj(f => ({ ...f, status: e.target.value }))}>
                  <option value="ativo">Ativo</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={saveProj}>Criar Projeto</button>
          </div>
        </div>
      )}
    </div>
  )
}
