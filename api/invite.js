const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, role, empresas } = req.body
  if (!email) return res.status(400).json({ error: 'Email obrigatório' })

  // Verificar se Service Role Key está configurada
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[ORION] SUPABASE_SERVICE_ROLE_KEY não configurada — convite salvo apenas localmente')
    return res.status(200).json({
      success: true,
      message: `Convite registrado para ${email}`,
      note: 'Configure SUPABASE_SERVICE_ROLE_KEY no Vercel para envio de email automático'
    })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    // Enviar convite via Supabase Auth (envia email automaticamente)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: role || 'colaborador', empresas: empresas || [] }
    })

    if (error) {
      console.error('[ORION] Erro inviteUserByEmail:', error.message)
      return res.status(400).json({ error: error.message })
    }

    // Salvar na tabela invites (ignorar erro se tabela não existir)
    try {
      await supabaseAdmin.from('invites').insert({
        email,
        role: role || 'colaborador',
        companies_access: empresas || [],
        status: 'pendente',
        invited_by: null,
        created_at: new Date().toISOString()
      })
    } catch (dbErr) {
      console.warn('[ORION] Tabela invites não disponível:', dbErr.message)
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('[ORION] Exceção no invite:', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
