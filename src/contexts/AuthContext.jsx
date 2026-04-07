import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export const ROLES = {
  admin:       { label: 'Administrador', level: 5, permissions: ['all'] },
  gestor:      { label: 'Gestor',        level: 4, permissions: ['view', 'attach', 'classify', 'report'] },
  colaborador: { label: 'Colaborador',   level: 3, permissions: ['view', 'attach'] },
  contador:    { label: 'Contador',      level: 3, permissions: ['view', 'attach', 'classify', 'report'] },
  assistente:  { label: 'Assistente',    level: 2, permissions: ['view'] },
  pendente:    { label: 'Pendente',      level: 0, permissions: [] },
}

export function logAudit(action, details, userId, userName) {
  try {
    const log = JSON.parse(localStorage.getItem('orion_audit_log') || '[]')
    log.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user_id: userId || 'sistema',
      user_name: userName || 'Sistema',
      action,
      details: details || '',
    })
    localStorage.setItem('orion_audit_log', JSON.stringify(log.slice(0, 2000)))
  } catch (_) {}
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)  // começa true — app espera verificação

  useEffect(() => {
    // ── MODO DEMO (sem Supabase configurado) ──
    if (isDemoMode) {
      // NUNCA restaura sessão automaticamente em modo demo.
      // O usuário SEMPRE precisa fazer login.
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    // ── MODO SUPABASE ──
    // Verifica sessão existente com timeout de 5s.
    // Se Supabase não responder (projeto pausado, URL errada, rede lenta),
    // o timeout garante que o loading seja liberado e o usuário vá para o Login.
    let cancelled = false

    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve({ data: { session: null }, _timedOut: true }), 5000)
    )

    Promise.race([sessionPromise, timeoutPromise]).then(async (result) => {
      if (cancelled) return
      const session = result?.data?.session
      if (session?.user) {
        setUser(session.user)
        // fetchProfileSilent também tem timeout interno de 3s
        await fetchProfileSilent(session.user.id)
      }
      if (!cancelled) setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    // Listener para mudanças de sessão (login/logout/expiração)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      if (session?.user) {
        setUser(session.user)
        await fetchProfileSilent(session.user.id)
      } else {
        // Sem sessão válida: limpa estado → App.jsx redireciona para Login
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfileSilent(userId) {
    try {
      const profilePromise = supabase.from('profiles').select('*').eq('id', userId).single()
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: null }), 3000))
      const { data } = await Promise.race([profilePromise, timeoutPromise])
      if (data) setProfile(data)
    } catch (_) {}
  }

  async function signIn(email, password) {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      const u = users.find(x => x.email === email && x.pass === btoa(password))
      if (!u) throw new Error('Usuário ou senha incorretos')
      if (u.role === 'pendente') throw new Error('Conta pendente de aprovação. Aguarde o administrador liberar seu acesso.')
      if (u.access_expires && new Date(u.access_expires) < new Date()) {
        throw new Error('Acesso expirado. Entre em contato com o administrador.')
      }
      setUser({ id: u.id })
      setProfile(u)
      logAudit('LOGIN', 'Sessão iniciada', u.id, u.name)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, name, phone, cpf) {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      if (users.find(x => x.email === email)) throw new Error('E-mail já cadastrado')
      const isFirst = users.length === 0
      const u = {
        id: Date.now().toString(), name, email, phone, cpf,
        pass: btoa(password),
        role: isFirst ? 'admin' : 'pendente',
        companies_access: null,
        access_expires: null,
        avatar_url: null,
      }
      users.push(u)
      localStorage.setItem('orion_users', JSON.stringify(users))
      logAudit('CADASTRO', `Novo usuário: ${email} — papel: ${u.role}`, u.id, u.name)
      if (isFirst) {
        setUser({ id: u.id })
        setProfile(u)
      } else {
        throw new Error('Conta criada! Aguarde a aprovação do administrador para acessar.')
      }
      return
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone, cpf } },
    })
    if (error) throw error
  }

  async function resetPassword(email) {
    if (isDemoMode) throw new Error('Recuperação de senha não disponível em modo demo')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/',
    })
    if (error) throw error
  }

  async function signOut() {
    if (user && profile) logAudit('LOGOUT', 'Sessão encerrada', user?.id, profile?.name)
    setUser(null)
    setProfile(null)
    if (!isDemoMode) {
      await supabase.auth.signOut()
    }
  }

  // ── UPLOAD DE AVATAR ──
  async function uploadAvatar(file) {
    if (!file) throw new Error('Nenhum arquivo selecionado')
    // Validação: apenas imagens
    if (!file.type.startsWith('image/')) throw new Error('Apenas imagens são aceitas (PNG, JPG, WebP)')

    if (isDemoMode) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const url = ev.target.result
          await updateProfile({ avatar_url: url })
          logAudit('AVATAR_ATUALIZADO', 'Foto de perfil alterada (demo)', user?.id, profile?.name)
          resolve(url)
        }
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
    }

    // Supabase Storage
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('orion-assets')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw upErr
    const { data: { publicUrl } } = supabase.storage.from('orion-assets').getPublicUrl(path)
    await updateProfile({ avatar_url: publicUrl })
    logAudit('AVATAR_ATUALIZADO', 'Foto de perfil alterada', user?.id, profile?.name)
    return publicUrl
  }

  async function updateProfile(updates) {
    if (isDemoMode) {
      const p = { ...profile, ...updates }
      setProfile(p)
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      const idx = users.findIndex(u => u.id === profile.id)
      if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; localStorage.setItem('orion_users', JSON.stringify(users)) }
      logAudit('PERFIL_ATUALIZADO', `Campos: ${Object.keys(updates).join(', ')}`, profile.id, profile.name)
      return
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) throw error
    setProfile(prev => ({ ...prev, ...updates }))
  }

  async function inviteUser(email, role = 'pendente', companiesAccess = null, permissions = null) {
    if (isDemoMode) {
      const invites = JSON.parse(localStorage.getItem('orion_invites') || '[]')
      invites.push({
        id: Date.now(), email, role,
        companies_access: companiesAccess,
        custom_permissions: permissions,
        accepted: false,
        token: Math.random().toString(36).slice(2),
        created_at: new Date().toISOString()
      })
      localStorage.setItem('orion_invites', JSON.stringify(invites))
      logAudit('CONVITE_ENVIADO', `${email} — papel: ${role}`, user?.id, profile?.name)
      return
    }
    const { error } = await supabase.from('invites').insert({ email, role, invited_by: user.id })
    if (error) throw error
    await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) }).catch(() => {})
  }

  async function updateUserPermissions(userId, permissions) {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      const idx = users.findIndex(u => u.id === userId)
      if (idx >= 0) {
        users[idx].custom_permissions = permissions || null
        localStorage.setItem('orion_users', JSON.stringify(users))
      }
      logAudit('PERMISSOES_ATUALIZADAS', `Usuário ${userId} — perms: ${(permissions || []).join(',')}`, user?.id, profile?.name)
      return
    }
    await supabase.from('profiles').update({ custom_permissions: permissions }).eq('id', userId)
  }

  async function getInvites() {
    if (isDemoMode) return JSON.parse(localStorage.getItem('orion_invites') || '[]')
    const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false })
    return data || []
  }

  async function getUsers() {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      return users.map(u => ({ ...u, pass: undefined }))
    }
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    return data || []
  }

  async function updateUserRole(userId, role) {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      const idx = users.findIndex(u => u.id === userId)
      if (idx >= 0) { users[idx].role = role; localStorage.setItem('orion_users', JSON.stringify(users)) }
      logAudit('ROLE_ALTERADO', `Usuário ${userId} → ${role}`, user?.id, profile?.name)
      return
    }
    await supabase.from('profiles').update({ role }).eq('id', userId)
    logAudit('ROLE_ALTERADO', `Usuário ${userId} → ${role}`, user?.id, profile?.name)
  }

  async function updateUserAccess(userId, companiesAccess, accessExpires) {
    if (isDemoMode) {
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]')
      const idx = users.findIndex(u => u.id === userId)
      if (idx >= 0) {
        users[idx].companies_access = companiesAccess || null
        users[idx].access_expires = accessExpires || null
        localStorage.setItem('orion_users', JSON.stringify(users))
      }
      logAudit('ACESSO_ATUALIZADO', `Usuário ${userId} — empresas: ${companiesAccess?.join(',') || 'todas'}`, user?.id, profile?.name)
      return
    }
    await supabase.from('profiles').update({ companies_access: companiesAccess, access_expires: accessExpires }).eq('id', userId)
  }

  function getAuditLog() {
    return JSON.parse(localStorage.getItem('orion_audit_log') || '[]')
  }

  function logAction(action, details) {
    logAudit(action, details, user?.id, profile?.name)
  }

  const isAdmin    = profile?.role === 'admin'
  const isGestor   = ['admin', 'gestor'].includes(profile?.role)
  const canEdit    = ['admin', 'gestor', 'contador'].includes(profile?.role)
  const canDelete  = profile?.role === 'admin'
  const userCompanies = profile?.companies_access || null

  function hasPermission(perm) {
    if (!profile) return false
    if (profile.role === 'admin') return true
    if (profile.custom_permissions && Array.isArray(profile.custom_permissions)) {
      return profile.custom_permissions.includes(perm)
    }
    const rolePerms = ROLES[profile.role]?.permissions || []
    return rolePerms.includes('all') || rolePerms.includes(perm)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isGestor, canEdit, canDelete, userCompanies,
      signIn, signUp, signOut, resetPassword, updateProfile, uploadAvatar,
      inviteUser, getInvites, getUsers, updateUserRole, updateUserAccess,
      updateUserPermissions, hasPermission,
      getAuditLog, logAction,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
