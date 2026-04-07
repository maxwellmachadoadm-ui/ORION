import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, ROLES } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useApp } from '../contexts/AppContext'
import Maxxxi from './Maxxxi'
import { OrionLogo } from './OrionLogo'
import { PDFExportButton } from './PDFExport'

const TIPO_ICON = { contrato: '📋', meta: '🎯', inadimplencia: '💳', fluxo: '💰', tarefa: '☑' }

const ALL_INVITE_PERMISSIONS = [
  { key: 'view',     label: 'Visualizar dados' },
  { key: 'attach',   label: 'Anexar arquivos' },
  { key: 'classify', label: 'Classificar despesas' },
  { key: 'report',   label: 'Emitir relatórios' },
]

export default function Layout({ children }) {
  const { profile, signOut, isAdmin, inviteUser, uploadAvatar } = useAuth()
  const { empresas, tarefas, generateAlerts, generateAlertsV5 } = useData()
  const { presentationMode, togglePresentation } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const avatarInputRef = useRef(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('pendente')
  const [inviteCompanies, setInviteCompanies] = useState([])
  const [invitePermissions, setInvitePermissions] = useState([])
  const [inviteExpiry, setInviteExpiry] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteFeedback, setInviteFeedback] = useState(null)

  const pending = tarefas.filter(t => t.status !== 'done').length
  const alerts = generateAlertsV5 ? generateAlertsV5() : (generateAlerts ? generateAlerts() : [])
  const isActive = (path) => location.pathname === path ? 'sb-item active' : 'sb-item'

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') { setSearchOpen(false); setAlertsOpen(false); setUserMenuOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const searchResults = searchQuery.length >= 2 ? [
    ...empresas.filter(e => e.nome.toLowerCase().includes(searchQuery.toLowerCase()) || e.sigla.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(e => ({ title: e.nome, sub: e.descricao, icon: e.sigla, color: e.cor, action: () => { navigate(`/empresa/${e.id}`); setSearchOpen(false) } })),
    ...tarefas.filter(t => t.titulo.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
      .map(t => {
        const e = empresas.find(x => x.id === t.empresa_id)
        return { title: t.titulo, sub: `${e?.nome || ''} — ${t.prioridade}`, icon: '☑', color: e?.cor || '#64748b', action: () => { navigate('/tarefas'); setSearchOpen(false) } }
      })
  ] : []

  // ── Invite handler ──
  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteFeedback(null)
    try {
      await inviteUser(
        inviteEmail,
        inviteRole,
        inviteCompanies.length > 0 ? inviteCompanies : null,
        invitePermissions.length > 0 ? invitePermissions : null
      )
      setInviteFeedback({ type: 'ok', msg: `Convite enviado para ${inviteEmail}` })
      setTimeout(() => {
        setInviteEmail('')
        setInviteRole('pendente')
        setInviteCompanies([])
        setInvitePermissions([])
        setInviteExpiry('')
        setInviteFeedback(null)
        setInviteOpen(false)
      }, 1800)
    } catch (err) {
      setInviteFeedback({ type: 'err', msg: err.message })
    }
    setInviteLoading(false)
  }

  function toggleInviteCompany(id) {
    setInviteCompanies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleInvitePermission(key) {
    setInvitePermissions(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }

  // ── Avatar upload ──
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    setUserMenuOpen(false)
    try {
      await uploadAvatar(file)
    } catch (err) {
      alert('Erro ao enviar foto: ' + err.message)
    }
    setAvatarLoading(false)
    // Reset input
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div className={`app ${presentationMode ? 'presentation-mode' : ''}`}>
      {/* TOPBAR */}
      <header className="topbar">
        <div className="flex aic gap12">
          <button className="tb-btn burger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <OrionLogo size={32} />
            <div className="logo-text">
              <div className="orion-logo-text">ORION</div>
              <div className="logo-sub">Gestão Executiva</div>
            </div>
          </div>
          {(() => {
            const h = new Date().getHours()
            const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
            const firstName = (profile?.name || 'Maxwell').split(' ')[0]
            const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
            return (
              <div className="topbar-greeting">
                <span className="topbar-greeting-name">{greeting}, {firstName}</span>
                <span className="topbar-greeting-date">{dateStr}</span>
              </div>
            )
          })()}
          <button className="tb-btn" onClick={() => setSearchOpen(true)}>⌘ Busca rápida</button>
        </div>
        <div className="flex aic gap8">
          <button className="notif" onClick={() => { setAlertsOpen(!alertsOpen); setUserMenuOpen(false) }}>
            🔔{alerts.length > 0 && <span className="notif-dot"></span>}
          </button>
          <PDFExportButton />
          <button
            className={`tb-btn ${presentationMode ? 'btn-active-mode' : ''}`}
            onClick={togglePresentation}
            title={presentationMode ? 'Sair do Modo Apresentação' : 'Modo Apresentação'}
            style={{ color: presentationMode ? 'var(--gold)' : undefined }}
          >
            {presentationMode ? '🔒 Modo Exec' : '📊 Apresentar'}
          </button>
          <button className="tb-btn" id="api-indicator" title="API Claude" style={{ color: 'var(--green)', borderColor: 'rgba(16,185,129,0.3)' }}>⚡ API</button>
          <button className="user-btn" onClick={() => { setUserMenuOpen(!userMenuOpen); setAlertsOpen(false) }}>
            {/* Avatar: foto se disponível, senão iniciais */}
            <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {avatarLoading
                ? <span style={{ fontSize: 10 }}>⏳</span>
                : profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initials
              }
            </div>
            <span>{profile?.name?.split(' ')[0] || 'Usuário'}</span>
          </button>
        </div>
      </header>

      {/* Hidden avatar file input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />

      <div className="main">
        {/* SIDEBAR */}
        <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-section">
            <div className="sb-lbl">Navegação</div>
            <div className={isActive('/')} onClick={() => { navigate('/'); setSidebarOpen(false) }}>🏠 Home</div>
            <div className={isActive('/dashboard')} onClick={() => { navigate('/dashboard'); setSidebarOpen(false) }}>📊 Dashboard</div>
            <div className={isActive('/tarefas')} onClick={() => { navigate('/tarefas'); setSidebarOpen(false) }}>
              ☑ Tarefas <span className="sb-badge">{pending}</span>
            </div>
            <div className={isActive('/crm')} onClick={() => { navigate('/crm'); setSidebarOpen(false) }}>🎯 CRM</div>
            <div className={isActive('/financeiro')} onClick={() => { navigate('/financeiro'); setSidebarOpen(false) }}>💳 Financeiro</div>
            <div className={isActive('/arquivo')} onClick={() => { navigate('/arquivo'); setSidebarOpen(false) }}>📁 Arquivo Digital</div>
            <div className={isActive('/compromissos')} onClick={() => { navigate('/compromissos'); setSidebarOpen(false) }}>📅 Compromissos</div>
            <div className={isActive('/ceo')} onClick={() => { navigate('/ceo'); setSidebarOpen(false) }}>📈 Visão CEO</div>
          </div>
          <div className="sb-div"></div>
          <div className="sb-section">
            <div className="sb-lbl">Portfólio</div>
            {empresas.filter(e => e.id !== 'gp').map(e => (
              <div key={e.id}
                className={location.pathname === `/empresa/${e.id}` ? 'sb-item active' : 'sb-item'}
                onClick={() => { navigate(`/empresa/${e.id}`); setSidebarOpen(false) }}>
                {e.logo_url
                  ? <img src={e.logo_url} alt={e.sigla}
                      style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                  : <div className="sb-dot" style={{ background: e.cor }}></div>
                }
                <span style={{ flex: 1, fontSize: 13 }}>{e.nome}</span>
                <span className={`sb-score ${e.score >= 75 ? 'good' : e.score >= 55 ? 'warn' : 'bad'}`}>{e.score}</span>
              </div>
            ))}
            <div className="sb-add" onClick={() => { navigate('/admin'); setSidebarOpen(false) }}>+ Nova empresa</div>
          </div>
          <div className="sb-div"></div>
          <div className="sb-section">
            <div className="sb-lbl">Pessoal</div>
            {empresas.filter(e => e.id === 'gp').map(e => (
              <div key={e.id}
                className={location.pathname === `/empresa/${e.id}` ? 'sb-item active' : 'sb-item'}
                onClick={() => { navigate(`/empresa/${e.id}`); setSidebarOpen(false) }}>
                <div className="sb-dot" style={{ background: e.cor }}></div>
                <span style={{ flex: 1, fontSize: 13 }}>💰 {e.nome}</span>
                {e.score > 0 && <span className={`sb-score ${e.score >= 75 ? 'good' : e.score >= 55 ? 'warn' : 'bad'}`}>{e.score}</span>}
              </div>
            ))}
          </div>
          {isAdmin && (
            <>
              <div className="sb-div"></div>
              <div className="sb-section">
                <div className="sb-lbl">Administração</div>
                <div className={isActive('/admin')} onClick={() => { navigate('/admin'); setSidebarOpen(false) }}>⚙ Painel Admin</div>
                <div className="sb-item" onClick={() => { setInviteOpen(true); setSidebarOpen(false) }}>👥 Convidar usuário</div>
              </div>
            </>
          )}
          <div className="sb-maxxxi">
            <div className="maxxxi-pill">
              <span style={{ fontSize: 20 }}>🤖</span>
              <div><div className="maxxxi-name">MAXXXI</div><div className="maxxxi-status"><div className="pulse"></div> Online</div></div>
            </div>
          </div>
        </nav>

        {/* CONTENT */}
        <main className="content">{children}</main>
      </div>

      {/* SEARCH MODAL */}
      {searchOpen && (
        <div className="search-overlay show" onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
          <div className="search-box">
            <input className="search-input" placeholder="Buscar empresas, tarefas, contatos..." autoFocus
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="search-results">
              {searchResults.length === 0 && <div className="search-empty">
                {searchQuery.length < 2 ? 'Digite para buscar no ecossistema ORION' : `Nenhum resultado para "${searchQuery}"`}
              </div>}
              {searchResults.map((r, i) => (
                <div key={i} className="search-item" onClick={r.action}>
                  <div className="search-item-icon" style={{ background: r.color + '18', color: r.color }}>{r.icon}</div>
                  <div><div className="search-item-title">{r.title}</div><div className="search-item-sub">{r.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ALERTS PANEL */}
      {alertsOpen && (
        <div className="alerts-panel show">
          <div className="alerts-hdr">
            <span>Alertas ({alerts.length})</span>
            <button onClick={() => setAlertsOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          {alerts.length === 0
            ? <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Nenhum alerta ativo</div>
            : alerts.map((a, i) => (
              <div key={i} className="alert-item" onClick={() => { navigate(`/empresa/${a.emp}`); setAlertsOpen(false) }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>{a.level === 'critico' ? '🔴' : '🟡'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.text}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{a.level === 'critico' ? 'Crítico' : 'Atenção'}</div>
                    {a.tipo && <div style={{ fontSize: 10, color: '#64748b' }}>{TIPO_ICON[a.tipo] || ''} {a.tipo}</div>}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* USER MENU */}
      {userMenuOpen && (
        <div className="user-menu show">
          <div style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {profile?.email}<br/>
            <span style={{ textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>{profile?.role}</span>
          </div>
          {/* Alterar foto — abre file input */}
          <div className="user-menu-item" onClick={() => { setUserMenuOpen(false); avatarInputRef.current?.click() }}>
            📷 {avatarLoading ? 'Enviando foto...' : 'Alterar foto'}
          </div>
          <div className="user-menu-item danger" onClick={() => { signOut(); setUserMenuOpen(false) }}>⏎ Sair da conta</div>
        </div>
      )}

      {/* ── INVITE MODAL (expandido) ── */}
      {inviteOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setInviteOpen(false)}>
          <div className="modal" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title">
              <span>👥 Convidar Usuário</span>
              <button className="modal-close" onClick={() => setInviteOpen(false)}>×</button>
            </div>

            <form onSubmit={handleInvite}>
              {/* E-mail */}
              <div className="form-group">
                <label className="form-label">E-mail do Convidado *</label>
                <input
                  className="inp" type="email" required
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>

              {/* Perfil */}
              <div className="form-group">
                <label className="form-label">Perfil de Acesso</label>
                <select className="inp" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Empresas */}
              <div className="form-group">
                <label className="form-label">Empresas com Acesso</label>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                  Deixe em branco para acesso a todas as empresas.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '6px 0' }}>
                  {empresas.map(e => (
                    <button key={e.id} type="button"
                      onClick={() => toggleInviteCompany(e.id)}
                      style={{
                        padding: '5px 12px', borderRadius: 99,
                        border: `2px solid ${inviteCompanies.includes(e.id) ? e.cor : 'var(--border)'}`,
                        background: inviteCompanies.includes(e.id) ? e.cor + '22' : 'transparent',
                        color: inviteCompanies.includes(e.id) ? e.cor : 'var(--text3)',
                        cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: '.15s',
                      }}>
                      {e.sigla}
                    </button>
                  ))}
                </div>
                {inviteCompanies.length === 0
                  ? <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ Acesso total a todas as empresas</div>
                  : <div style={{ fontSize: 11, color: 'var(--text3)' }}>Acesso restrito a: {inviteCompanies.join(', ')}</div>
                }
              </div>

              {/* Permissões */}
              <div className="form-group">
                <label className="form-label">Permissões de Ações</label>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                  Deixe em branco para usar as permissões padrão do perfil.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ALL_INVITE_PERMISSIONS.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(p.key)}
                        onChange={() => toggleInvitePermission(p.key)}
                        style={{ width: 15, height: 15, cursor: 'pointer' }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiração */}
              <div className="form-group">
                <label className="form-label">Acesso expira em (opcional)</label>
                <input type="date" className="inp" value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)} />
              </div>

              {/* Feedback */}
              {inviteFeedback && (
                <div className={`notification-bar ${inviteFeedback.type === 'ok' ? 'success' : 'danger'}`} style={{ marginBottom: 12 }}>
                  {inviteFeedback.type === 'ok' ? '✅ ' : '⚠ '}{inviteFeedback.msg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInviteOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={inviteLoading}>
                  {inviteLoading ? 'Enviando...' : '📨 Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAXXXI CHAT */}
      <Maxxxi />
    </div>
  )
}
