import { useState, useEffect } from 'react'
import { useAuth, ROLES } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

const TABS = ['usuarios', 'empresas', 'auditoria', 'maxxxi']
const TAB_LABELS = {
  usuarios: '👥 Usuários',
  empresas: '🏢 Empresas',
  auditoria: '📋 Auditoria',
  maxxxi: '🤖 Log MAXXXI'
}

function RolePill({ role }) {
  const r = ROLES[role] || { label: role, level: 0 }
  const colors = {
    admin:       'pill pill-blue',
    gestor:      'pill pill-purple',
    colaborador: 'pill pill-green',
    contador:    'pill pill-amber',
    assistente:  'pill pill-gray',
    pendente:    'pill pill-red',
  }
  return <span className={colors[role] || 'pill pill-gray'}>{r.label}</span>
}

export default function Admin() {
  const { isAdmin, getUsers, updateUserRole, updateUserAccess, updateUserPermissions, getAuditLog, profile } = useAuth()
  const { empresas, addEmpresa, removeEmpresa, uploadLogoEmpresa } = useData()
  const [tab, setTab] = useState('usuarios')
  const [users, setUsers] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [maxxxiLog, setMaxxxiLog] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editCompanies, setEditCompanies] = useState([])
  const [editExpires, setEditExpires] = useState('')
  const [editPermissions, setEditPermissions] = useState([])
  const [searchAudit, setSearchAudit] = useState('')
  const [newEmpModal, setNewEmpModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteConfirm2, setDeleteConfirm2] = useState(false)
  const [newEmp, setNewEmp] = useState({ nome: '', sigla: '', descricao: '', cor: '#3b82f6', rgb: '59,130,246' })
  const [logoUploading, setLogoUploading] = useState(null)

  const ALL_PERMISSIONS = [
    { key: 'view',     label: 'Somente visualizar' },
    { key: 'attach',   label: 'Anexar arquivos' },
    { key: 'classify', label: 'Classificar despesas' },
    { key: 'report',   label: 'Emitir relatórios' },
  ]

  useEffect(() => {
    loadUsers()
    setAuditLog(getAuditLog())
    try { setMaxxxiLog(JSON.parse(localStorage.getItem('orion_maxxxi_log') || '[]')) } catch { setMaxxxiLog([]) }
  }, [tab])

  async function loadUsers() {
    const u = await getUsers()
    setUsers(u)
  }

  function openEditUser(u) {
    setEditingUser(u)
    setEditRole(u.role || 'pendente')
    setEditCompanies(u.companies_access || [])
    setEditExpires(u.access_expires ? u.access_expires.slice(0, 10) : '')
    setEditPermissions(u.custom_permissions || [])
  }

  async function saveUserEdit() {
    if (!editingUser) return
    await updateUserRole(editingUser.id, editRole)
    await updateUserAccess(editingUser.id, editCompanies.length === 0 ? null : editCompanies, editExpires || null)
    await updateUserPermissions(editingUser.id, editPermissions.length === 0 ? null : editPermissions)
    await loadUsers()
    setEditingUser(null)
  }

  function togglePermission(key) {
    setEditPermissions(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  function toggleCompany(id) {
    setEditCompanies(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleAddEmpresa(e) {
    e.preventDefault()
    if (!newEmp.nome || !newEmp.sigla) return
    await addEmpresa(newEmp)
    setNewEmpModal(false)
    setNewEmp({ nome: '', sigla: '', descricao: '', cor: '#3b82f6', rgb: '59,130,246' })
  }

  async function handleDeleteEmpresa() {
    if (!deleteConfirm || !deleteConfirm2) return
    await removeEmpresa(deleteConfirm.id)
    setDeleteConfirm(null)
    setDeleteConfirm2(false)
  }

  async function handleLogoUpload(empresaId, file) {
    if (!file) return
    setLogoUploading(empresaId)
    try { await uploadLogoEmpresa(empresaId, file) }
    finally { setLogoUploading(null) }
  }

  const filteredAudit = auditLog.filter(a =>
    !searchAudit || a.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
    (a.user_name || '').toLowerCase().includes(searchAudit.toLowerCase()) ||
    (a.details || '').toLowerCase().includes(searchAudit.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="icon">🔒</div>
        <p>Acesso restrito ao Administrador.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Painel de Administração</h1>
          <p>Gerenciamento de usuários, acessos e trilha de auditoria</p>
        </div>
      </div>

      <div className="tabs mb">
        {TABS.map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── USUÁRIOS ── */}
      {tab === 'usuarios' && (
        <>
          <div className="g4 mb">
            <div className="module-card" style={{ padding: 16 }}>
              <div className="lbl">Total de Usuários</div>
              <div className="val txt-blue" style={{ fontSize: 28 }}>{users.length}</div>
            </div>
            <div className="module-card" style={{ padding: 16 }}>
              <div className="lbl">Admins</div>
              <div className="val" style={{ fontSize: 28 }}>{users.filter(u => u.role === 'admin').length}</div>
            </div>
            <div className="module-card" style={{ padding: 16 }}>
              <div className="lbl">Pendentes</div>
              <div className="val txt-amber" style={{ fontSize: 28 }}>{users.filter(u => u.role === 'pendente').length}</div>
            </div>
            <div className="module-card" style={{ padding: 16 }}>
              <div className="lbl">Com Acesso Restrito</div>
              <div className="val txt-purple" style={{ fontSize: 28 }}>{users.filter(u => u.companies_access && u.companies_access.length > 0).length}</div>
            </div>
          </div>

          <div className="module-card">
            <div className="module-card-title">👥 Lista de Usuários</div>
            <table className="exec-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Empresas</th>
                  <th>Acesso até</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--tx)' }}>
                      {u.id === profile?.id ? '★ ' : ''}{u.name || '—'}
                    </td>
                    <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{u.email}</td>
                    <td><RolePill role={u.role} /></td>
                    <td style={{ fontSize: 12 }}>
                      {!u.companies_access || u.companies_access.length === 0
                        ? <span style={{ color: 'var(--green)', fontSize: 11 }}>Todas</span>
                        : u.companies_access.map(id => {
                            const e = empresas.find(x => x.id === id)
                            return e ? <span key={id} className="badge" style={{ background: e.cor + '22', color: e.cor, marginRight: 3 }}>{e.sigla}</span> : null
                          })}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--tx3)' }}>
                      {u.access_expires ? new Date(u.access_expires).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <button className="btn btn-icon" style={{ fontSize: 14 }} onClick={() => openEditUser(u)} title="Editar acesso">✏</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── EMPRESAS ── */}
      {tab === 'empresas' && (
        <>
          <div className="flex aic jsb mb">
            <div className="slbl" style={{ margin: 0 }}>Empresas do Ecossistema ({empresas.length})</div>
            <button className="btn btn-primary btn-sm" onClick={() => setNewEmpModal(true)}>+ Nova Empresa</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {empresas.map(emp => (
              <div key={emp.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                {/* Logo/Sigla */}
                <div style={{
                  width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                  background: emp.cor ? `${emp.cor}22` : 'rgba(59,130,246,.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: `1px solid ${emp.cor || '#3b82f6'}30`,
                }}>
                  {emp.logo_url
                    ? <img src={emp.logo_url} alt={emp.sigla} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 13, fontWeight: 700, color: emp.cor || '#3b82f6' }}>{emp.sigla}</span>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{emp.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.descricao}</div>
                </div>

                {/* Score */}
                <div className={`hring ${emp.score >= 70 ? 'good' : emp.score >= 40 ? 'warn' : 'bad'}`} style={{ marginRight: 8 }}>
                  {emp.score}
                </div>

                {/* Upload logo */}
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }} title="Upload de logo">
                  <span className="btn btn-secondary btn-sm">
                    {logoUploading === emp.id ? '⏳' : '🖼 Logo'}
                  </span>
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleLogoUpload(emp.id, e.target.files[0])}
                  />
                </label>

                {/* Delete (não permite deletar empresas base) */}
                {!['dw','of','fs','cdl','gp'].includes(emp.id) && (
                  <button className="btn btn-danger btn-sm" onClick={() => { setDeleteConfirm(emp); setDeleteConfirm2(false) }}>
                    🗑 Remover
                  </button>
                )}
                {['dw','of','fs','cdl','gp'].includes(emp.id) && (
                  <span style={{ fontSize: 10, color: 'var(--text4)', whiteSpace: 'nowrap' }}>Base</span>
                )}
              </div>
            ))}
          </div>

          {/* Modal nova empresa */}
          {newEmpModal && (
            <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setNewEmpModal(false)}>
              <div className="modal" style={{ maxWidth: 440 }}>
                <div className="modal-title">
                  <span>🏢 Nova Empresa</span>
                  <button className="modal-close" onClick={() => setNewEmpModal(false)}>×</button>
                </div>
                <form onSubmit={handleAddEmpresa}>
                  <div className="form-group">
                    <label className="form-label">Nome da empresa *</label>
                    <input className="inp" required placeholder="Ex: Consultoria ABC" value={newEmp.nome} onChange={e => setNewEmp(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="form-row cols-2">
                    <div className="form-group">
                      <label className="form-label">Sigla *</label>
                      <input className="inp" required placeholder="Ex: ABC" maxLength={5} value={newEmp.sigla} onChange={e => setNewEmp(p => ({ ...p, sigla: e.target.value.toUpperCase() }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cor</label>
                      <input type="color" className="inp" value={newEmp.cor} style={{ padding: '4px 8px', height: 36 }} onChange={e => setNewEmp(p => ({ ...p, cor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <input className="inp" placeholder="Ex: Consultoria especializada em..." value={newEmp.descricao} onChange={e => setNewEmp(p => ({ ...p, descricao: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setNewEmpModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Criar Empresa</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal confirmar exclusão */}
          {deleteConfirm && (
            <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
              <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-title">
                  <span>Confirmar Exclusão</span>
                  <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
                </div>
                <div className="notification-bar danger" style={{ marginBottom: 16 }}>
                  Você está prestes a remover permanentemente a empresa <strong>{deleteConfirm.nome}</strong>.
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
                  Todos os dados associados (KPIs, OKRs, tarefas, contratos) serão perdidos. Esta ação não pode ser desfeita.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                  <input type="checkbox" checked={deleteConfirm2} onChange={e => setDeleteConfirm2(e.target.checked)} />
                  Confirmo que desejo excluir "{deleteConfirm.nome}" permanentemente
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                  <button className="btn btn-danger" disabled={!deleteConfirm2} onClick={handleDeleteEmpresa}>
                    🗑 Excluir Definitivamente
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── AUDITORIA ── */}
      {tab === 'auditoria' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              className="inp"
              style={{ maxWidth: 360, padding: '8px 14px', fontSize: 13 }}
              placeholder="Filtrar por ação, usuário ou detalhe..."
              value={searchAudit}
              onChange={e => setSearchAudit(e.target.value)}
            />
          </div>
          <div className="module-card">
            <div className="module-card-title">📋 Trilha de Auditoria ({filteredAudit.length} registros)</div>
            {filteredAudit.length === 0 && <div className="empty-state"><div className="icon">📋</div><p>Nenhum registro encontrado</p></div>}
            <table className="exec-table">
              <thead>
                <tr><th>Timestamp</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr>
              </thead>
              <tbody>
                {filteredAudit.slice(0, 200).map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--tx3)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {new Date(a.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{a.user_name}</td>
                    <td>
                      <span className="pill pill-blue" style={{ fontSize: 10 }}>{a.action}</span>
                    </td>
                    <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── LOG MAXXXI ── */}
      {tab === 'maxxxi' && (
        <div className="module-card">
          <div className="module-card-title">🤖 Log do Agente MAXXXI ({maxxxiLog.length} interações)</div>
          {maxxxiLog.length === 0 && <div className="empty-state"><div className="icon">🤖</div><p>Nenhuma interação registrada ainda</p></div>}
          <table className="exec-table">
            <thead>
              <tr><th>Timestamp</th><th>Usuário</th><th>Pergunta</th><th>Modo</th><th>Tokens</th></tr>
            </thead>
            <tbody>
              {maxxxiLog.slice(0, 200).map((m, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--tx3)', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {new Date(m.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{m.user_name || '—'}</td>
                  <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</td>
                  <td><span className={`pill ${m.mode === 'server' ? 'pill-green' : 'pill-gray'}`} style={{ fontSize: 10 }}>{m.mode === 'server' ? 'API' : 'Local'}</span></td>
                  <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{m.tokens || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar usuário */}
      {editingUser && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal" style={{ width: 480 }}>
            <div className="modal-title">
              <span>✏ Editar Acesso — {editingUser.name}</span>
              <button className="modal-close" onClick={() => setEditingUser(null)}>×</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 18 }}>{editingUser.email}</div>

            <div className="form-group">
              <label className="form-label">Papel / Perfil</label>
              <select className="inp" value={editRole} onChange={e => setEditRole(e.target.value)}>
                {Object.entries(ROLES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Empresas com Acesso (vazio = todas)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0' }}>
                {empresas.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleCompany(e.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, border: `2px solid ${editCompanies.includes(e.id) ? e.cor : 'var(--br)'}`,
                      background: editCompanies.includes(e.id) ? e.cor + '22' : 'transparent',
                      color: editCompanies.includes(e.id) ? e.cor : 'var(--tx3)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: '.15s',
                    }}
                  >
                    {e.sigla} — {e.nome}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                {editCompanies.length === 0 ? '✓ Acesso total a todas as empresas' : `Acesso a: ${editCompanies.join(', ')}`}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Acesso expira em (opcional)</label>
              <input type="date" className="inp" value={editExpires} onChange={e => setEditExpires(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Permissões Customizadas</label>
              <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:8 }}>
                Deixe vazio para usar as permissões padrão do papel selecionado.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 0' }}>
                {ALL_PERMISSIONS.map(p => (
                  <label key={p.key} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:13, color:'var(--tx2)' }}>
                    <input
                      type="checkbox"
                      checked={editPermissions.includes(p.key)}
                      onChange={() => togglePermission(p.key)}
                      style={{ width:15, height:15, cursor:'pointer' }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <div style={{ fontSize:11, color:'var(--tx3)', marginTop:4 }}>
                {editPermissions.length === 0
                  ? '✓ Usando permissões padrão do papel'
                  : `Permissões customizadas: ${editPermissions.join(', ')}`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveUserEdit}>Salvar</button>
              <button className="btn" onClick={() => setEditingUser(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
