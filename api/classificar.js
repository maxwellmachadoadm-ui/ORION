// api/classificar.js — Vercel Function (Extratos IA Fase 1)
// Classifica transações usando Claude Haiku 4.5
// Input:  { descricoes: [{ id, descricao, valor, tipo }] }
// Output: { classificacoes: [{ id, categoria, subcategoria, confianca, motivo }] }

export default async function handler(req, res) {
  // CORS básico (mesmo domínio, mas defensivo)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { descricoes } = req.body || {};
  if (!Array.isArray(descricoes) || descricoes.length === 0) {
    return res.status(400).json({ error: 'descricoes array required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  // Limitar batch para caber no maxDuration (30s) e economizar tokens
  const batch = descricoes.slice(0, 20);

  const prompt = `Você é um classificador financeiro brasileiro. Classifique cada transação abaixo em categoria e subcategoria.

Categorias disponíveis:
- Receita: Vendas, Serviços, Investimentos, Outros
- Despesa Fixa: Aluguel, Salários, Software, Impostos, Internet, Energia
- Despesa Variável: Marketing, Viagens, Materiais, Manutenção, Fornecedores
- Pessoal: Alimentação, Transporte, Saúde, Educação, Lazer
- Financeiro: Juros, Taxas Bancárias, Empréstimos, Tarifas
- Outros: Não classificado

Retorne APENAS um JSON válido (sem markdown, sem texto extra) no formato:
[
  {"id": "...", "categoria": "...", "subcategoria": "...", "confianca": 0.0-1.0, "motivo": "..."}
]

Transações:
${batch.map(t => `ID: ${t.id} | ${t.tipo === 'credito' ? 'ENTRADA' : 'SAÍDA'} R$ ${t.valor} | ${t.descricao}`).join('\n')}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: errText.slice(0, 500) });
    }

    const data = await response.json();
    const textContent = data.content?.[0]?.text || '[]';

    // Extrair JSON da resposta (tolerante a markdown fence ```json)
    let classificacoes = [];
    try {
      const cleaned = textContent.replace(/```json|```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) classificacoes = JSON.parse(match[0]);
    } catch (e) {
      return res.status(500).json({ error: 'Parse error', raw: textContent.slice(0, 300) });
    }

    return res.status(200).json({
      classificacoes,
      usage: data.usage,
      model: data.model,
      batch_size: batch.length
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
