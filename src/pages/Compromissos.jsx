import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

const STATUS_CONFIG = {
  a_vencer:  { label: 'A Vencer',      color: '#3b82f6', bg: '#3b82f622', icon: '🟡' },
  vencendo:  { label: 'Vencendo Hoje', color: '#f59e0b', bg: '#f59e0b22', icon: '🔴' },
  atrasado:  { label: 'Atrasado',      color: '#ef4444', bg: '#ef444422', icon: '⚫' },
  pago:      { label: 'Pago',          color: '#10b981', bg: '#10b98122', icon: '🟢' },
}

const FREQ_LABEL = { unico: 'Único', diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual' }

function fmtVal(v) {
  if (!v && v !== 0) return '—'
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Compromissos({ empresaId }) {
  const { getCompromissos, addCompromisso, deleteCompromisso, marcarPago, calcCompromissoStatus, empresas } = useData()
  const { canDelete } = useAuth()
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    nome: '', descricao: '', valor: '', vencimento: new Date().toISOString().slice(0,10),
    frequencia: 'mensal', tipo: 'recorrente', categoria: 'ESCRITÓRIO', banco: 'Nubank'
  })

  const todos = getCompromissos(empresaId).map(c => ({ ...c, statusCalc: calcCompromissoStatus(c) }))
  const filtrados = filtroStatus === 'all' ? todos : todos.filter(c => c.statusCalc === filtroStatus)

  const totais = {
    a_vencer: todos.filter(c => c.statusCalc === 'a_vencer').reduce((s, c) => s + Number(c.valor), 0),
    vencendo: todos.filter(c => c.statusCalc === 'vencendo').reduce((s, c) => s + Number(c.valor), 0),
    atrasado: todos.filter(c => c.statusCalc === 'atrasado').reduce((s, c) => s + Number(c.valor), 0),
    pago:     todos.filter(c => c.statusCalc === 'pago').reduce((s, c) => s + Number(c.valor), 0),
  }

  function handleAdd(e) {
    e.preventDefault()
    addCompromisso({ ...form, valor: parseFloat(form.valor) || 0, empresa_id: empresaId || 'dw', status: 'a_vencer', pago_em: null })
    setShowModal(false)
    setForm({ nome: '', descricao: '', valor: '', vencimento: new Date().toISOString().slice(0,10), frequencia: 'mensal', tipo: 'recorrente', categoria: 'ESCRITÓRIO', banco: 'Nubank' })
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="g4 mb">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="module-card" style={{ padding: 16, cursor: 'pointer', border: filtroStatus === key ? `1px solid ${cfg.color}` : undefined }}
            onClick={() => setFiltroStatus(filtroStatus === key ? 'all' : key)}>
            <div className="lbl">{cfg.icon} {cfg.label}</div>
            <div className="val" style={{ color: cfg.color, fontSize: 20 }}>{fmtVal(totais[key])}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{todos.filter(c => c.statusCalc === key).length} compromisso(s)</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex aic jsb mb">
        <div className="slbl" style={{ margin: 0 }}>
          {filtroStatus === 'all' ? `Todos os Compromissos (${filtrados.length})` : `${STATUS_CONFIG[filtroStatus]?.label} (${filtrados.length})`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {filtroStatus !== 'all' && <button className="btn btn-secondary btn-sm" onClick={() => setFiltroStatus('all')}>Ver Todos</button>}
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Novo Compromisso</button>
        </div>
      </div>

      {/* List */}
      {filtrados.length === 0 ? (
        <div className="empty-state"><div className="icon">📅</div><p>Nenhum compromisso encontrado.</p></div>
      ) : (
        <div className="module-card">
          <table className="exec-table">
            <thead>
              <tr><th>Nome</th><th>Valor</th><th>Vencimento</th><th>Frequência</th><th>Categoria</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtrados.map(c => {
                const cfg = STATUS_CONFIG[c.statusCalc] || STATUS_CONFIG.a_vencer
                const hoje = new Date(); hoje.setHours(0,0,0,0)
                const venc = new Date(c.vencimento); venc.setHours(0,0,0,0)
                const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={c.id} style={{ background: c.statusCalc === 'atrasado' ? 'rgba(239,68,68,0.04)' : c.statusCalc === 'vencendo' ? 'rgba(245,158,11,0.04)' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{c.nome}</div>
                      {c.descricao && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.descricao}</div>}
                    </td>
                    <td style={{ color: cfg.color, fontWeight: 700 }}>{fmtVal(c.valor)}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{new Date(c.vencimento).toLocaleDateString('pt-BR')}</div>
                      {c.statusCalc !== 'pago' && (
                        <div style={{ fontSize: 10, color: diff < 0 ? '#ef4444' : diff <= 3 ? '#f59e0b' : 'var(--text3)' }}>
                          {diff < 0 ? `${Math.abs(diff)}d atrasado` : diff === 0 ? 'Vence hoje!' : `em ${diff} dias`}
                        </div>
                      )}
                    </td>
                    <td><span style={{ fontSize: 11, color: 'var(--text3)' }}>{FREQ_LABEL[c.frequencia] || c.frequencia}</span></td>
                    <td><span className="pill pill-gray" style={{ fontSize: 10 }}>{c.categoria}</span></td>
                    <td>
                      <span className="pill" style={{ background: cfg.bg, color: cfg.color, fontSize: 10 }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.statusCalc !== 'pago' && (
                          <button className="btn btn-primary btn-sm" onClick={() => marcarPago(c.id)} title="Marcar como pago">
                            ✓ Pago
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-danger btn-sm" onClick={() => {
                            if (confirm(`Deletar "${c.nome}"?`)) deleteCompromisso(c.id)
                          }}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ width: 480 }}>
            <div className="modal-title">
              <span>📅 Novo Compromisso</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="inp" required placeholder="Ex: Aluguel escritório" value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input className="inp" type="number" required min="0" step="0.01" placeholder="0,00" value={form.valor} onChange={e => setForm(p => ({...p, valor: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vencimento *</label>
                  <input className="inp" type="date" required value={form.vencimento} onChange={e => setForm(p => ({...p, vencimento: e.target.value}))} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="inp" value={form.tipo} onChange={e => setForm(p => ({...p, tipo: e.target.value}))}>
                    <option value="unico">Único</option>
                    <option value="recorrente">Recorrente</option>
                  </select>
                </div>
                {form.tipo === 'recorrente' && (
                  <div className="form-group">
                    <label className="form-label">Frequência</label>
                    <select className="inp" value={form.frequencia} onChange={e => setForm(p => ({...p, frequencia: e.target.value}))}>
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="inp" value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))}>
                    {['ESCRITÓRIO','PESSOAL','MARKETING','IMPOSTOS','FINANCEIRO','OUTROS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Banco / Conta</label>
                  <select className="inp" value={form.banco} onChange={e => setForm(p => ({...p, banco: e.target.value}))}>
                    {['Nubank','C6 Bank','Caixa Econômica','Itaú','Bradesco','Santander','BTG Pactual','Inter','Outro'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input className="inp" placeholder="Detalhes adicionais (opcional)" value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Criar Compromisso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
