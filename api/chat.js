// Mapa de modelos válidos — fallback seguro se front enviar ID antigo
const MODEL_ALIASES = {
  'claude-haiku-4-5':          'claude-3-5-haiku-20241022',
  'claude-3-5-haiku':          'claude-3-5-haiku-20241022',
  'claude-sonnet-4-5':         'claude-sonnet-4-5',
  'claude-sonnet-4-6':         'claude-sonnet-4-5',
  'claude-sonnet-4-20250514':  'claude-sonnet-4-5',
  'claude-opus-4-5':           'claude-opus-4-5',
}
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022'

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor. Configure no painel do Vercel.' })
  }

  const { model, max_tokens, system, messages } = req.body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Campo "messages" ausente ou inválido' })
  }

  // Resolve alias ou usa default
  const resolvedModel = MODEL_ALIASES[model] || (model?.startsWith('claude-') ? model : DEFAULT_MODEL)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: Math.min(max_tokens || 1024, 4096),
        system: system || 'Você é MAXXXI, o CFO Virtual da plataforma ORION Gestão Executiva.',
        messages: messages.slice(-20)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data))
      return res.status(response.status).json({
        error: data?.error?.message || 'Erro na API Anthropic',
        model_used: resolvedModel,
        ...data
      })
    }

    return res.status(200).json({ ...data, model_used: resolvedModel })
  } catch (err) {
    console.error('MAXXXI chat handler error:', err)
    return res.status(502).json({ error: 'Falha ao contatar API Anthropic', detail: err.message })
  }
}
