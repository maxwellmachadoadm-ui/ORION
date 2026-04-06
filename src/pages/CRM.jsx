import { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

const FASES = ['Lead', 'Proposta', 'Negociação', 'Fechado', 'Perdido']
const FASE_COLORS = {
  Lead:        { bg: 'rgba(59,130,246,.12)',  text: '#60a5fa', border: 'rgba(59,130,246,.3)' },
  Proposta:    { bg: 'rgba(245,158,11,.12)',  text: '#fbbf24', border: 'rgba(245,158,11,.3)' },
  Negociação:  { bg: 'rgba(139,92,246,.12)',  text: '#a78bfa', border: 'rgba(139,92,246,.3)' },
  Fechado:     { bg: 'rgba(16,185,129,.12)',  text: '#34d399', border: 'rgba(16,185,129,.3)' },
  Perdido:     { bg: 'rgba(239,68,68,.12)',   text: '#f87171', border: 'rgba(239,68,68,.3)' },
}

const BLANK_LEAD = { nome: '', empresa_id: '', fase: 'Lead', valor: '', contato: '', prazo: '', obs: '' }

function LeadCard({ lead, empresas, onEdit }) {
  const emp = empresas.find(e => e.id === lead.empresa_id)
  return (
    <div className="crm-lead-card" onClick={() => onEdit(lead)}>
      <div className="crm-lead-header">
        <strong style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.3 }}>{lead.nome}</strong>
        {emp && (
          <span className="badge" style={{ background: emp.cor + '22', color: emp.cor, border: `1px solid ${emp.cor}44`, fontSize: 9 }}>
            {emp.sigla}
          </span>
        )}
      </div>
      {lead.valor && <div style={{ fontSize: 12, color: 'var(--green)', fontFamily: "'Syne',sans-serif", fontWeight: 700, marginTop: 4 }}>{lead.valor}</div>}
      {lead.contato && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 3 }}>👤 {lead.contato}</div>}
      {lead.prazo && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>📅 {lead.prazo}</div>}
      {lead.obs && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.4 }}>{lead.obs}</div>}
    </div>
  )
}

export default function CRM() {
  const { empresas, crmLeads, setCrmLeads } = useData()
  const { logAction } = useAuth()

  const [filterEmp, setFilterEmp] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [form, setForm] = useState(BLANK_LEAD)

  const leadsKey = 'orion_crm_extra'

  // Carregar leads extras do localStorage
  const [extraLeads, setExtraLeads] = useState(() => {
    try { return JSON.parse(localStorage.getItem(leadsKey) || '[]') } catch { return [] }
  })

  const allLeads = useMemo(() => {
    const base = [...crmLeads, ...extraLeads]
    return base
      .filter(l => filterEmp === 'all' || l.empresa_id === filterEmp)
      .filter(l => !searchQ || l.nome.toLowerCase().includes(searchQ.toLowerCase()) || (l.contato || '').toLowerCase().includes(searchQ.toLowerCase()))
  }, [crmLeads, extraLeads, filterEmp, searchQ])

  function openNew() {
    setEditingLead(null)
    setForm({ ...BLANK_LEAD, empresa_id: filterEmp !== 'all' ? filterEmp : '' })
    setModalOpen(true)
  }

  function openEdit(lead) {
    if (!lead._extra) return // não editar dados seed
    setEditingLead(lead)
    setForm({ nome: lead.nome, empresa_id: lead.empresa_id, fase: lead.fase, valor: lead.valor || '', contato: lead.contato || '', prazo: lead.prazo || '', obs: lead.obs || '' })
    setModalOpen(true)
  }

  function saveLead() {
    if (!form.nome.trim() || !form.empresa_id) return
    const extras = [...extraLeads]
    if (editingLead) {
      const idx = extras.findIndex(l => l.id === editingLead.id)
      if (idx >= 0) extras[idx] = { ...extras[idx], ...form }
      logAction('CRM_LEAD_EDITADO', `${form.nome} — ${form.fase}`)
    } else {
      const newLead = { id: Date.now().toString(), ...form, _extra: true, created_at: new Date().toISOString() }
      extras.push(newLead)
      logAction('CRM_LEAD_CRIADO', `${form.nome} — ${form.empresa_id} — ${form.fase}`)
    }
    setExtraLeads(extras)
    localStorage.setItem(leadsKey, JSON.stringify(extras))
    setModalOpen(false)
  }

  function deleteLead(lead) {
    if (!lead._extra) return
    const extras = extraLeads.filter(l => l.id !== lead.id)
    setExtraLeads(extras)
    localStorage.setItem(leadsKey, JSON.stringify(extras))
    logAction('CRM_LEAD_REMOVIDO', lead.nome)
    setModalOpen(false)
  }

  function moveLead(lead, novaFase) {
    if (!lead._extra) return
    const extras = extraLeads.map(l => l.id === lead.id ? { ...l, fase: novaFase } : l)
    setExtraLeads(extras)
    localStorage.setItem(leadsKey, JSON.stringify(extras))
    logAction('CRM_LEAD_MOVIDO', `${lead.nome} → ${novaFase}`)
  }

  // Stats
  const stats = useMemo(() => {
    const base = [...crmLeads, ...extraLeads]
    return {
      total: base.length,
      fechados: base.filter(l => l.fase === 'Fechado').length,
      negociando: base.filter(l => l.fase === 'Negociação').length,
      leads: base.filter(l => l.fase === 'Lead').length,
    }
  }, [crmLeads, extraLeads])

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>CRM — Pipeline Comercial</h1>
          <p>Gestão de leads e oportunidades do ecossistema</p>
        </div>
        <button className="btn btn-blue" onClick={openNew}>+ Novo Lead</button>
      </div>

      {/* Stats */}
      <div className="g4 mb">
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Total de Leads</div>
          <div className="val" style={{ fontSize: 28 }}>{stats.total}</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Em Negociação</div>
          <div className="val txt-amber" style={{ fontSize: 28 }}>{stats.negociando}</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Fechados</div>
          <div className="val txt-green" style={{ fontSize: 28 }}>{stats.fechados}</div>
        </div>
        <div className="module-card" style={{ padding: 16 }}>
          <div className="lbl">Novos Leads</div>
          <div className="val txt-blue" style={{ fontSize: 28 }}>{stats.leads}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="inp"
          style={{ flex: 1, maxWidth: 280, padding: '8px 14px', fontSize: 13 }}
          placeholder="Buscar lead ou contato..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`btn${filterEmp === 'all' ? ' btn-blue' : ''}`} onClick={() => setFilterEmp('all')}>Todas</button>
          {empresas.filter(e => e.id !== 'gp').map(e => (
            <button key={e.id} className={`btn${filterEmp === e.id ? ' btn-blue' : ''}`}
              style={filterEmp === e.id ? {} : {}}
              onClick={() => setFilterEmp(e.id)}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: e.cor, flexShrink: 0 }}></span>
              {e.sigla}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, overflowX: 'auto' }}>
        {FASES.map(fase => {
          const leadsNaFase = allLeads.filter(l => l.fase === fase)
          const c = FASE_COLORS[fase]
          return (
            <div key={fase} style={{ background: 'var(--s1)', border: '1px solid var(--br)', borderTop: `3px solid ${c.border}`, borderRadius: 'var(--r)', padding: 12, minHeight: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: c.text }}>{fase}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.text }}>{leadsNaFase.length}</span>
              </div>
              <div>
                {leadsNaFase.map((l, i) => (
                  <LeadCard key={l.id || i} lead={l} empresas={empresas} onEdit={openEdit} />
                ))}
                {leadsNaFase.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '20px 0', opacity: .5 }}>Sem leads</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Lead */}
      {modalOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ width: 460 }}>
            <div className="modal-title">
              <span>{editingLead ? 'Editar Lead' : 'Novo Lead'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Nome do Lead *</label>
              <input className="inp" placeholder="Ex.: Dr. João Silva / Empresa XYZ" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Empresa *</label>
                <select className="inp" value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {empresas.filter(e => e.id !== 'gp').map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fase</label>
                <select className="inp" value={form.fase} onChange={e => setForm(f => ({ ...f, fase: e.target.value }))}>
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor / Ticket</label>
                <input className="inp" placeholder="Ex.: R$ 2.000/mês" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo / Data</label>
                <input className="inp" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Contato</label>
              <input className="inp" placeholder="Nome, telefone ou e-mail" value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="inp" rows={3} style={{ resize: 'vertical' }} placeholder="Histórico, próximo passo..." value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={saveLead} style={{ flex: 1 }}>
                {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
              {editingLead && editingLead._extra && (
                <button className="btn btn-red" style={{ whiteSpace: 'nowrap' }} onClick={() => deleteLead(editingLead)}>🗑 Excluir</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
