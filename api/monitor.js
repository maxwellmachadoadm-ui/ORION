import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.ANTHROPIC_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({ alertas: [], mensagens: [], note: 'Supabase não configurado' })
  }

  // Proteger contra erros não tratados
  try {

  const supabase = createClient(supabaseUrl, serviceKey)
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const d7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const alertas = []

  // ── FORME SEGURO ──
  try {
    const { data: comp } = await supabase.from('compromissos').select('*').eq('empresa_id', 'fs').lt('vencimento', hojeStr).neq('status', 'pago')
    const { data: tar } = await supabase.from('tarefas').select('*').eq('empresa_id', 'fs').eq('prioridade', 'alta').neq('status', 'done')
    const { data: lanc } = await supabase.from('lancamentos').select('*').eq('empresa_id', 'fs').gte('created_at', d30)
    const rec = (lanc || []).filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor || 0), 0)
    const desp = (lanc || []).filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor || 0), 0)
    if (comp?.length > 0) alertas.push({ empresa_id: 'fs', empresa: 'Forme Seguro', nivel: 'critico', tipo: 'compromissos_vencidos', dados: { quantidade: comp.length, valor: comp.reduce((s, c) => s + (c.valor || 0), 0) } })
    if (tar?.length > 3) alertas.push({ empresa_id: 'fs', empresa: 'Forme Seguro', nivel: 'atencao', tipo: 'tarefas_acumuladas', dados: { quantidade: tar.length } })
    if (rec > 0 && desp / rec > 0.85) alertas.push({ empresa_id: 'fs', empresa: 'Forme Seguro', nivel: 'critico', tipo: 'margem_baixa', dados: { receita: rec, despesa: desp, margem: ((1 - desp / rec) * 100).toFixed(1) } })
  } catch (_) {}

  // ── ORIGINAL FOTOGRAFIA ──
  try {
    const { data: parc } = await supabase.from('of_parcelas').select('*').eq('status', 'aberto').lt('data_vencimento', hojeStr)
    const { data: proj } = await supabase.from('of_projetos').select('*').in('status', ['producao', 'captacao'])
    if (parc?.length > 0) alertas.push({ empresa_id: 'of', empresa: 'Original Fotografia', nivel: 'critico', tipo: 'parcelas_vencidas', dados: { quantidade: parc.length, valor: parc.reduce((s, p) => s + (p.valor || 0), 0) } })
    const { data: lancOf } = await supabase.from('of_lancamentos').select('*').gte('created_at', d30)
    proj?.forEach(p => {
      if (p.status !== 'producao') return
      const recProj = (lancOf || []).filter(l => l.projeto_id === p.id && l.tipo === 'receita').reduce((s, l) => s + (l.valor_realizado || 0), 0)
      if (p.meta_receita > 0 && recProj / p.meta_receita < 0.3) {
        alertas.push({ empresa_id: 'of', empresa: 'Original Fotografia', nivel: 'atencao', tipo: 'meta_baixa', dados: { projeto: p.nome, meta: p.meta_receita, realizado: recProj, pct: ((recProj / p.meta_receita) * 100).toFixed(0) } })
      }
    })
  } catch (_) {}

  // ── GESTÃO PESSOAL ──
  try {
    const { data: comp } = await supabase.from('compromissos').select('*').eq('empresa_id', 'gp').lte('vencimento', d7).neq('status', 'pago')
    const { data: trans } = await supabase.from('transacoes').select('*').eq('status_validacao', 'pendente')
    if (comp?.length > 0) alertas.push({ empresa_id: 'gp', empresa: 'Gestão Pessoal', nivel: 'atencao', tipo: 'vencimentos_proximos', dados: { quantidade: comp.length, valor: comp.reduce((s, c) => s + (c.valor || 0), 0) } })
    if (trans?.length > 10) alertas.push({ empresa_id: 'gp', empresa: 'Gestão Pessoal', nivel: 'info', tipo: 'transacoes_pendentes', dados: { quantidade: trans.length } })
  } catch (_) {}

  if (alertas.length === 0) return res.status(200).json({ alertas: [], mensagens: [] })

  // ── Gerar mensagens com IA ──
  const mensagens = []
  if (apiKey) {
    for (const alerta of alertas.slice(0, 5)) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 300,
            messages: [{ role: 'user', content: `Você é MAXXXI, agente executivo do ORION. Gere mensagem direta para Maxwell sobre: ${JSON.stringify(alerta)}. Use 🔴🟡🟢. Máximo 2 parágrafos. Termine com ação concreta.` }]
          })
        })
        if (r.ok) {
          const data = await r.json()
          const msg = { empresa_id: alerta.empresa_id, empresa: alerta.empresa, nivel: alerta.nivel, tipo: alerta.tipo, mensagem: data.content?.[0]?.text || '', created_at: new Date().toISOString() }
          mensagens.push(msg)
          try { await supabase.from('maxxxi_alertas').insert({ empresa_id: msg.empresa_id, nivel: msg.nivel, tipo: msg.tipo, mensagem: msg.mensagem }) } catch (_) {}
        }
      } catch (_) {}
    }
  }

  return res.status(200).json({ alertas, mensagens })

  } catch (err) {
    console.error('[ORION Monitor] Erro geral:', err.message)
    return res.status(200).json({ alertas: [], mensagens: [], error: err.message })
  }
}
