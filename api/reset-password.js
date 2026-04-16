const { Resend } = require('resend')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email obrigatório' })

  const resend = new Resend(process.env.RESEND_API_KEY)

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const link = `https://orion-platform-wine.vercel.app?reset=${token}&email=${encodeURIComponent(email)}`

  try {
    await resend.emails.send({
      from: 'ORION <noreply@orion.app>',
      to: email,
      subject: 'Recuperação de senha — ORION',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080c18;color:#f1f5f9;padding:32px;border-radius:12px;">
          <h2 style="color:#f59e0b;font-size:20px;margin-bottom:8px;">ORION — Recuperação de senha</h2>
          <p style="color:#94a3b8;margin-bottom:24px;">Clique no botão abaixo para criar uma nova senha. O link expira em 1 hora.</p>
          <a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Criar nova senha</a>
          <p style="color:#4a5568;font-size:12px;margin-top:24px;">Se você não solicitou isso, ignore este email.</p>
        </div>
      `
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
