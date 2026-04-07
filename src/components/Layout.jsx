import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useApp } from '../contexts/AppContext'
import Maxxxi from './Maxxxi'
import { OrionLogo } from './OrionLogo'
import { PDFExportButton } from './PDFExport'

const TIPO_ICON = { contrato: '📋', meta: '🎯', inadimplencia: '💳', fluxo: '💰', tarefa: '☑' }

export default function Layout({ children }) {
  const { profile, signOut, isAdmin, inviteUser, getInvites, getUsers } = useAuth()
  const { empresas, tarefas, generateAlerts, generateAlertsV5 } = useData()
  const { presentationMode, togglePresentation } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pending = tarefas.filter(t => t.status !== 'done').length
  const alerts = generateAlertsV5 ? generateAlertsV5() : generateAlerts()
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

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail) return
    await inviteUser(inviteEmail, inviteRole)
    alert(`Convite enviado para ${inviteEmail}`)
    setInviteEmail('')
    setInviteOpen(false)
  }

  const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

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
          <button className="tb-btn" onClick={() => setSearchOpen(true)}>⌘ Busca rapida</button>
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
            <div className="avatar">{initials}</div>
            <span>{profile?.name || 'Usuario'}</span>
          </button>
        </div>
      </header>

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
            <div className={isActive('/ceo')} onClick={() => { navigate('/ceo'); setSidebarOpen(false) }}>📈 Visão CEO</div>
          </div>
          <div className="sb-div"></div>
          <div className="sb-section">
            <div className="sb-lbl">Portfolio</div>
            {empresas.filter(e => e.id !== 'gp').map(e => (
              <div key={e.id} className={location.pathname === `/empresa/${e.id}` ? 'sb-item active' : 'sb-item'}
                onClick={() => { navigate(`/empresa/${e.id}`); setSidebarOpen(false) }}>
                <div className="sb-dot" style={{ background: e.cor }}></div>
                <span style={{ flex: 1, fontSize: 13 }}>{e.nome}</span>
                <span className={`sb-score ${e.score >= 75 ? 'good' : e.score >= 55 ? 'warn' : 'bad'}`}>{e.score}</span>
              </div>
            ))}
            <div className="sb-add" onClick={() => alert('Funcionalidade em desenvolvimento')}>+ Nova empresa</div>
          </div>
          <div className="sb-div"></div>
          <div className="sb-section">
            {empresas.filter(e => e.id === 'gp').map(e => (
              <div key={e.id} className={location.pathname === `/empresa/${e.id}` ? 'sb-item active' : 'sb-item'}
                onClick={() => { navigate(`/empresa/${e.id}`); setSidebarOpen(false) }}>💰 {e.nome}</div>
            ))}
            <div className={isActive('/of-projetos')} onClick={() => { navigate('/of-projetos'); setSidebarOpen(false) }}>📷 OF Projetos</div>
          </div>
          {isAdmin && (
            <>
              <div className="sb-div"></div>
              <div className="sb-section">
                <div className="sb-lbl">Administração</div>
                <div className={isActive('/admin')} onClick={() => { navigate('/admin'); setSidebarOpen(false) }}>⚙ Painel Admin</div>
                <div className={isActive('/classificacoes')} onClick={() => { navigate('/classificacoes'); setSidebarOpen(false) }}>🏷 Classificações</div>
                <div className="sb-item" onClick={() => setInviteOpen(true)}>👥 Convidar usuário</div>
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
          <div className="alerts-hdr"><span>Alertas ({alerts.length})</span><button onClick={() => setAlertsOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>×</button></div>
          {alerts.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Nenhum alerta ativo</div> :
            alerts.map((a, i) => (
              <div key={i} className="alert-item" onClick={() => { navigate(`/empresa/${a.emp}`); setAlertsOpen(false) }}>
                <div style={{ fontSize: 16, flexShrink: 0 }}>
                  {a.level === 'critico' ? '🔴' : '🟡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.text}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{a.level === 'critico' ? 'Crítico' : 'Atenção'}</div>
                    {a.tipo && <div style={{ fontSize: 10, color: '#64748b' }}>{TIPO_ICON[a.tipo] || ''} {a.tipo}</div>}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* USER MENU */}
      {userMenuOpen && (
        <div className="user-menu show">
          <div style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {profile?.email}<br/><span style={{ textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>{profile?.role}</span>
          </div>
          <div className="user-menu-item" onClick={() => { setUserMenuOpen(false) }}>📷 Alterar foto</div>
          <div className="user-menu-item danger" onClick={() => { signOut(); setUserMenuOpen(false) }}>⏎ Sair da conta</div>
        </div>
      )}

      {/* INVITE MODAL */}
      {inviteOpen && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setInviteOpen(false)}>
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-title"><span>👥 Convidar Usuario</span><button className="modal-close" onClick={() => setInviteOpen(false)}>×</button></div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="inp" type="email" required placeholder="email@exemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Permissao</label>
                <select className="inp" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary">Enviar Convite</button>
            </form>
          </div>
        </div>
      )}

      {/* MAXXXI CHAT */}
      <Maxxxi />
    </div>
  )
}
