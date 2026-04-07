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
    // Em modo demo, NUNCA restaura sessão automaticamente.
    // O usuário sempre precisa fazer login manualmente.
    if (isDemoMode) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    // ── MODO SUPABASE ──
    let cancelled = false

    // Detecta se a URL atual tem token de recovery (link do email de reset de senha).
    // Nesse caso NÃO pode chamar signOut — o token seria destruído antes de ser processado.
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const isRecoveryUrl = hashParams.get('type') === 'recovery'

    // O listener DEVE ser registrado ANTES de qualquer verificação de flag.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      // Fluxo de reset de senha: redireciona para página dedicada
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('orion_recovery_session', '1')
        setLoading(false)
        window.location.replace('/reset-password')
        return
      }

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          sessionStorage.setItem('orion_session_active', '1')
          sessionStorage.removeItem('orion_recovery_session')
        }
        setUser(session.user)
        await fetchProfileSilent(session.user.id)
        setLoading(false)
      } else {
        sessionStorage.removeItem('orion_session_active')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    const sessionFlag = sessionStorage.getItem('orion_session_active')
    const recoveryFlag = sessionStorage.getItem('orion_recovery_session')

    // Durante recovery, não forçar logout — aguardar evento PASSWORD_RECOVERY
    if (isRecoveryUrl || recoveryFlag) {
      // Supabase vai processar o token e disparar PASSWORD_RECOVERY via onAuthStateChange
      // Apenas garantir que loading seja liberado após timeout de segurança
      setTimeout(() => { if (!cancelled) setLoading(false) }, 3000)
    } else if (!sessionFlag) {
      // Sem flag e sem recovery: força logout e mostra login
      supabase.auth.signOut().catch(() => {})
      if (!cancelled) setLoading(false)
    } else {
      // Tenta restaurar sessão existente nesta aba
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => resolve({ data: { session: null }, _timedOut: true }), 5000)
      )
      Promise.race([sessionPromise, timeoutPromise]).then(async (result) => {
        if (cancelled) return
        const session = result?.data?.session
        if (session?.user) {
          setUser(session.user)
          await fetchProfileSilent(session.user.id)
        } else {
          sessionStorage.removeItem('orion_session_active')
        }
        if (!cancelled) setLoading(false)
      }).catch(() => {
        if (!cancelled) setLoading(false)
      })
    }

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
    // Marca sessão ativa nesta aba — necessário para restaurar após refresh
    sessionStorage.setItem('orion_session_active', '1')
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
      redirectTo: window.location.origin + '/auth/callback',
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    // Após mudar senha: limpa flags de recovery e ativa sessão normal
    sessionStorage.removeItem('orion_recovery_session')
    sessionStorage.setItem('orion_session_active', '1')
  }

  async function signOut() {
    if (user && profile) logAudit('LOGOUT', 'Sessão encerrada', user?.id, profile?.name)
    setUser(null)
    setProfile(null)
    // Remove flag de sessão — próxima abertura do app exigirá login
    sessionStorage.removeItem('orion_session_active')
    sessionStorage.removeItem('orion_demo_session')
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
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket') || upErr.statusCode === 400) {
        throw new Error('Bucket de armazenamento não configurado. Execute o script supabase/create_buckets.sql no painel do Supabase.')
      }
      throw upErr
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
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
    // Validação de email
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('E-mail inválido. Verifique o formato e tente novamente.')
    }

    // Verificar duplicidade
    const existingInvites = JSON.parse(localStorage.getItem('orion_invites') || '[]')
    const alreadyInvited = existingInvites.find(i => i.email === cleanEmail && !i.accepted)
    if (alreadyInvited) {
      throw new Error(`Já existe um convite pendente para ${cleanEmail}.`)
    }

    const invite = {
      id: Date.now(), email: cleanEmail, role,
      companies_access: companiesAccess,
      custom_permissions: permissions,
      accepted: false,
      status: 'pendente',
      token: Math.random().toString(36).slice(2),
      created_at: new Date().toISOString()
    }

    // Salvar convite no localStorage (funciona tanto em demo quanto como fallback)
    const saveToLocal = () => {
      const invites = JSON.parse(localStorage.getItem('orion_invites') || '[]')
      invites.push(invite)
      localStorage.setItem('orion_invites', JSON.stringify(invites))
    }

    if (isDemoMode) {
      saveToLocal()
      logAudit('CONVITE_ENVIADO', `${cleanEmail} — papel: ${role}`, user?.id, profile?.name)
      return
    }

    // Modo Supabase: tenta inserir na tabela 'invites'
    try {
      const { error } = await supabase.from('invites').insert({
        email: cleanEmail, role,
        invited_by: user?.id,
        companies_access: companiesAccess,
        custom_permissions: permissions,
        status: 'pendente',
      })
      if (error) {
        console.warn('[ORION] Erro ao salvar convite no Supabase:', error.message, error.code)
        saveToLocal()
      }
    } catch (err) {
      console.warn('[ORION] Exceção ao salvar convite:', err)
      saveToLocal()
    }

    // Tenta notificar via API (ignorar erros)
    try {
      const resp = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, role })
      })
      if (!resp.ok) console.warn('[ORION] API invite retornou status:', resp.status)
    } catch (err) {
      console.warn('[ORION] Falha ao enviar email de convite:', err.message)
    }

    logAudit('CONVITE_ENVIADO', `${cleanEmail} — papel: ${role}`, user?.id, profile?.name)
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
      signIn, signUp, signOut, resetPassword, updatePassword, updateProfile, uploadAvatar,
      inviteUser, getInvites, getUsers, updateUserRole, updateUserAccess,
      updateUserPermissions, hasPermission,
      getAuditLog, logAction,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
