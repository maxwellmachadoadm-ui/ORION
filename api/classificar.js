export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' })

  const { transacoes, regras, texto_bruto, imagem_base64, mime_type } = req.body

  const categoriasRef = `Categorias possíveis:
- Alimentação (sub: Restaurante, Supermercado, iFood/Delivery, Padaria, Outros)
- Moradia (sub: Aluguel, Condomínio, IPTU, Energia, Água, Gás, Internet, Manutenção)
- Transporte (sub: Combustível, Estacionamento, Uber/99, Pedágio, Manutenção Veículo, Seguro Auto)
- Saúde (sub: Plano de Saúde, Farmácia, Consulta Médica, Exames, Academia)
- Educação (sub: Mensalidade, Cursos, Livros, Material)
- Lazer (sub: Streaming, Viagem, Restaurante/Bar, Cultura, Esporte)
- Vestuário (sub: Roupas, Calçados, Acessórios)
- Investimento (sub: Renda Fixa, Renda Variável, FII, Previdência, Crypto)
- Receita (sub: Salário, Pró-labore, Dividendos, Aluguel Recebido, Freelance, Outros)
- Impostos (sub: IRPF, IPVA, IPTU, Outros Tributos)
- Financeiro (sub: Tarifa Bancária, Juros, Multa, IOF, Anuidade Cartão)
- Assinaturas (sub: Celular, Streaming, Apps, Clubes, Seguros)
- Transferência (sub: PIX Enviado, PIX Recebido, TED, DOC, Entre Contas)
- Outros (sub: Diversos, Não identificado)`

  const regrasTxt = regras?.length
    ? '\nRegras aprendidas (PRIORIDADE MÁXIMA):\n' +
      regras.map(r => `"${r.pattern}" → ${r.categoria} / ${r.subcategoria} (${r.confirmacoes}x)`).join('\n')
    : ''

  let messages = []
  let model = 'claude-3-5-haiku-20241022'
  let maxTokens = 4000

  // ── MODO 1: Imagem (OCR + classificação via vision) ──
  if (imagem_base64) {
    model = 'claude-sonnet-4-5'
    maxTokens = 8000
    messages = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mime_type || 'image/jpeg', data: imagem_base64 }
        },
        {
          type: 'text',
          text: `Você é o MAXXXI, classificador financeiro do ORION.
${regrasTxt}

Analise esta imagem de extrato bancário. Extraia TODAS as transações visíveis.
Para cada transação identifique: data, descrição, valor (negativo = despesa, positivo = receita).
Classifique cada uma em categoria e subcategoria.

${categoriasRef}

Responda APENAS com JSON válido, sem texto extra:
[{"data":"DD/MM/YYYY","descricao":"...","valor":-123.45,"categoria":"...","subcategoria":"...","confianca":"media"}]`
        }
      ]
    }]
  }
  // ── MODO 2: Texto bruto (PDF/Word extraído) ──
  else if (texto_bruto) {
    maxTokens = 8000
    messages = [{
      role: 'user',
      content: `Você é o MAXXXI, classificador financeiro do ORION.
${regrasTxt}

Analise este texto extraído de um extrato bancário. Identifique TODAS as transações.
Para cada transação extraia: data, descrição, valor (negativo = despesa, positivo = receita).
Classifique cada uma em categoria e subcategoria.

${categoriasRef}

Responda APENAS com JSON válido, sem texto extra:
[{"data":"DD/MM/YYYY","descricao":"...","valor":-123.45,"categoria":"...","subcategoria":"...","confianca":"media"}]

TEXTO DO EXTRATO:
${texto_bruto.slice(0, 15000)}`
    }]
  }
  // ── MODO 3: Transações estruturadas (CSV já parseado) ──
  else if (transacoes && Array.isArray(transacoes) && transacoes.length > 0) {
    messages = [{
      role: 'user',
      content: `Você é o MAXXXI, classificador de despesas pessoais do ORION.
${regrasTxt}

Classifique cada transação abaixo em categoria e subcategoria.

${categoriasRef}

Responda APENAS com um JSON array válido, sem texto extra, sem markdown:
[{"id":"...","categoria":"...","subcategoria":"...","confianca":"alta|media|baixa"}]

Transações para classificar:
${JSON.stringify(transacoes.map(t => ({ id: t.id, descricao: t.descricao, valor: t.valor })))}`
    }]
  } else {
    return res.status(400).json({ error: 'Envie transacoes (array), texto_bruto (string) ou imagem_base64 (string)' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[ORION] Classificar API error:', err)
      return res.status(500).json({ error: 'Erro na API Claude' })
    }

    const data = await response.json()
    const texto = data.content?.[0]?.text || ''

    try {
      const json = JSON.parse(texto.replace(/```json|```/g, '').trim())
      return res.status(200).json({ classificacoes: json })
    } catch {
      console.error('[ORION] Parse error:', texto.slice(0, 500))
      return res.status(500).json({ error: 'Erro ao parsear resposta da IA', raw: texto.slice(0, 300) })
    }
  } catch (err) {
    console.error('[ORION] Classificar exception:', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
