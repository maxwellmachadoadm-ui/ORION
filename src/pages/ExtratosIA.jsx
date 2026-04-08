import { useState, useEffect, useRef } from 'react'
// Imports dinâmicos — carregam só quando necessário (code splitting)
const loadXLSX = () => import('xlsx')
const loadMammoth = () => import('mammoth')

// ── Categorias padrão para despesas pessoais ──
const CATEGORIAS_GP = {
  'Alimentação':     { icon: '🍽️', sub: ['Restaurante', 'Supermercado', 'iFood/Delivery', 'Padaria', 'Outros'] },
  'Moradia':         { icon: '🏠', sub: ['Aluguel', 'Condomínio', 'IPTU', 'Energia', 'Água', 'Gás', 'Internet', 'Manutenção'] },
  'Transporte':      { icon: '🚗', sub: ['Combustível', 'Estacionamento', 'Uber/99', 'Pedágio', 'Manutenção Veículo', 'Seguro Auto'] },
  'Saúde':           { icon: '🏥', sub: ['Plano de Saúde', 'Farmácia', 'Consulta Médica', 'Exames', 'Academia'] },
  'Educação':        { icon: '📚', sub: ['Mensalidade', 'Cursos', 'Livros', 'Material'] },
  'Lazer':           { icon: '🎬', sub: ['Streaming', 'Viagem', 'Restaurante/Bar', 'Cultura', 'Esporte'] },
  'Vestuário':       { icon: '👔', sub: ['Roupas', 'Calçados', 'Acessórios'] },
  'Investimento':    { icon: '📈', sub: ['Renda Fixa', 'Renda Variável', 'FII', 'Previdência', 'Crypto'] },
  'Receita':         { icon: '💰', sub: ['Salário', 'Pró-labore', 'Dividendos', 'Aluguel Recebido', 'Freelance', 'Outros'] },
  'Impostos':        { icon: '🏛️', sub: ['IRPF', 'IPVA', 'IPTU', 'Outros Tributos'] },
  'Financeiro':      { icon: '🏦', sub: ['Tarifa Bancária', 'Juros', 'Multa', 'IOF', 'Anuidade Cartão'] },
  'Assinaturas':     { icon: '📱', sub: ['Celular', 'Streaming', 'Apps', 'Clubes', 'Seguros'] },
  'Transferência':   { icon: '🔄', sub: ['PIX Enviado', 'PIX Recebido', 'TED', 'DOC', 'Entre Contas'] },
  'Outros':          { icon: '📋', sub: ['Diversos', 'Não identificado'] },
}

const STATUS_COLORS = {
  pendente:  { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: '⏳ Pendente' },
  validado:  { bg: 'rgba(16,185,129,.12)', color: '#10b981', label: '✅ Validado' },
  corrigido: { bg: 'rgba(59,130,246,.12)', color: '#3b82f6', label: '✏️ Corrigido' },
}

const CONFIANCA_BADGE = {
  alta:  { icon: '🟢', label: 'Alta' },
  media: { icon: '🟡', label: 'Média' },
  regra: { icon: '🔵', label: 'Regra' },
  baixa: { icon: '🔴', label: 'Baixa' },
  ia:    { icon: '🤖', label: 'IA' },
}

// ── Heurísticas locais (fallback quando API não está disponível) ──
const REGRAS_HEURISTICAS = [
  { test: /supermercado|mercado|atacad|carrefour|assai|extra|pao de acucar/i, cat: 'Alimentação', sub: 'Supermercado' },
  { test: /ifood|rappi|uber\s*eats|delivery|restaurante|lanchonete|pizz/i, cat: 'Alimentação', sub: 'iFood/Delivery' },
  { test: /padaria|confeitaria|cafe/i, cat: 'Alimentação', sub: 'Padaria' },
  { test: /posto|shell|ipiranga|br\s*distribuidora|combustivel|gasolina|etanol/i, cat: 'Transporte', sub: 'Combustível' },
  { test: /uber|99|cabify|taxi/i, cat: 'Transporte', sub: 'Uber/99' },
  { test: /estacionamento|parking|estapar/i, cat: 'Transporte', sub: 'Estacionamento' },
  { test: /pedagio|autoban|ecovias|ccr/i, cat: 'Transporte', sub: 'Pedágio' },
  { test: /farmacia|droga|drogasil|panvel|pague\s*menos/i, cat: 'Saúde', sub: 'Farmácia' },
  { test: /unimed|amil|sulamerica|plano.*saude|hapvida/i, cat: 'Saúde', sub: 'Plano de Saúde' },
  { test: /smart\s*fit|academia|gym|bodytech/i, cat: 'Saúde', sub: 'Academia' },
  { test: /netflix|spotify|amazon.*prime|disney|hbo|youtube.*premium|apple.*tv|globoplay/i, cat: 'Assinaturas', sub: 'Streaming' },
  { test: /vivo|claro|tim|oi\s|celular|telefon/i, cat: 'Assinaturas', sub: 'Celular' },
  { test: /energia|cemig|enel|cpfl|copel|light/i, cat: 'Moradia', sub: 'Energia' },
  { test: /agua|saneamento|copasa|sabesp/i, cat: 'Moradia', sub: 'Água' },
  { test: /condominio|cond\./i, cat: 'Moradia', sub: 'Condomínio' },
  { test: /aluguel/i, cat: 'Moradia', sub: 'Aluguel' },
  { test: /internet|fibra|net\s/i, cat: 'Moradia', sub: 'Internet' },
  { test: /iptu/i, cat: 'Impostos', sub: 'IPTU' },
  { test: /ipva/i, cat: 'Impostos', sub: 'IPVA' },
  { test: /irpf|imposto.*renda/i, cat: 'Impostos', sub: 'IRPF' },
  { test: /tarifa|manut.*conta|anuidade/i, cat: 'Financeiro', sub: 'Tarifa Bancária' },
  { test: /juros|juro/i, cat: 'Financeiro', sub: 'Juros' },
  { test: /iof/i, cat: 'Financeiro', sub: 'IOF' },
  { test: /salario|folha|pagamento|pro.?labore/i, cat: 'Receita', sub: 'Salário' },
  { test: /dividendo|jscp|rendimento/i, cat: 'Receita', sub: 'Dividendos' },
  { test: /pix\s*recebido|transferencia\s*recebida|ted\s*recebid/i, cat: 'Receita', sub: 'Outros' },
  { test: /pix\s*enviado|pix\s*-|transferencia\s*enviad/i, cat: 'Transferência', sub: 'PIX Enviado' },
  { test: /seguro.*auto|porto.*seguro|tokio|liberty|azul.*seguros/i, cat: 'Transporte', sub: 'Seguro Auto' },
  { test: /cdb|lci|lca|tesouro|renda.*fixa/i, cat: 'Investimento', sub: 'Renda Fixa' },
  { test: /acoes|b3|corretora|xp|rico|clear|inter.*invest/i, cat: 'Investimento', sub: 'Renda Variável' },
  { test: /fii|fundo.*imob/i, cat: 'Investimento', sub: 'FII' },
  { test: /previdencia|pgbl|vgbl/i, cat: 'Investimento', sub: 'Previdência' },
]

export default function ExtratosIA() {
  const [transacoes, setTransacoes] = useState([])
  const [learned, setLearned] = useState({})
  const [historico, setHistorico] = useState([])
  const [uploading, setUploading] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [editCat, setEditCat] = useState('')
  const [editSub, setEditSub] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [tab, setTab] = useState('validacao')
  const [selectedAll, setSelectedAll] = useState(false)
  const [selected, setSelected] = useState({})
  const [loadedFromDB, setLoadedFromDB] = useState(false)
  const fileRef = useRef(null)
  const dropRef = useRef(null)

  // ── Carregar dados: Supabase primeiro, localStorage fallback ──
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const { supabase, isDemoMode } = await import('../lib/supabase')
        if (isDemoMode || !supabase) throw new Error('demo')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('no user')

        const [tRes, rRes, hRes] = await Promise.all([
          supabase.from('extratos_gp').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('extratos_regras').select('*').eq('user_id', user.id),
          supabase.from('extratos_historico').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ])
        if (tRes.data) setTransacoes(tRes.data)
        if (rRes.data) {
          const obj = {}; rRes.data.forEach(r => { obj[r.pattern] = { categoria: r.categoria, subcategoria: r.subcategoria, count: r.count } })
          setLearned(obj)
        }
        if (hRes.data) setHistorico(hRes.data)
        setLoadedFromDB(true)
      } catch (_) {
        // Fallback localStorage
        try { setTransacoes(JSON.parse(localStorage.getItem('orion_extratos_gp') || '[]')) } catch { setTransacoes([]) }
        try { setLearned(JSON.parse(localStorage.getItem('orion_extratos_learned') || '{}')) } catch { setLearned({}) }
        try { setHistorico(JSON.parse(localStorage.getItem('orion_extratos_hist') || '[]')) } catch { setHistorico([]) }
      }
    }
    loadFromSupabase()
  }, [])

  // ── Persistir: Supabase + localStorage ──
  useEffect(() => {
    localStorage.setItem('orion_extratos_gp', JSON.stringify(transacoes))
    localStorage.setItem('orion_extratos_learned', JSON.stringify(learned))
    localStorage.setItem('orion_extratos_hist', JSON.stringify(historico))
  }, [transacoes, learned, historico])

  // ── Sync para Supabase em background ──
  async function syncToSupabase(newTransacoes, newLearned, newHistorico) {
    try {
      const { supabase, isDemoMode } = await import('../lib/supabase')
      if (isDemoMode || !supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Transações novas (sem id uuid = ainda não salvas)
      if (newTransacoes) {
        for (const t of newTransacoes) {
          if (t._synced) continue
          await supabase.from('extratos_gp').upsert({
            id: t.id?.length === 36 ? t.id : undefined, // só se for uuid
            user_id: user.id, data: t.data, descricao: t.descricao, valor: t.valor,
            categoria: t.categoria, subcategoria: t.subcategoria,
            confianca: t.confianca, status: t.status, origem: t.origem,
          })
        }
      }

      // Regras aprendidas
      if (newLearned) {
        for (const [pattern, data] of Object.entries(newLearned)) {
          await supabase.from('extratos_regras').upsert({
            user_id: user.id, pattern,
            categoria: data.categoria, subcategoria: data.subcategoria,
            count: data.count || 1,
          }, { onConflict: 'user_id,pattern' })
        }
      }

      // Histórico
      if (newHistorico) {
        for (const h of newHistorico) {
          if (h._synced) continue
          await supabase.from('extratos_historico').upsert({
            id: h.id?.length === 36 ? h.id : undefined,
            user_id: user.id, arquivo: h.arquivo, banco: h.banco, qtd: h.qtd,
          })
        }
      }
    } catch (e) { console.warn('[MAXXXI] Sync Supabase:', e.message) }
  }

  // ── Classificar localmente (heurísticas + aprendizado) ──
  function localClassify(descricao, valor) {
    const key = descricao.toLowerCase().trim()
    // 1. Aprendizado do usuário (prioridade máxima)
    if (learned[key]) return { categoria: learned[key].categoria, subcategoria: learned[key].subcategoria, confianca: 'alta' }
    // Busca parcial
    for (const [lk, data] of Object.entries(learned)) {
      const words = lk.split(/\s+/)
      if (words.length >= 2 && words.every(w => key.includes(w))) {
        return { categoria: data.categoria, subcategoria: data.subcategoria, confianca: 'media' }
      }
    }
    // 2. Heurísticas
    for (const rule of REGRAS_HEURISTICAS) {
      if (rule.test.test(key)) return { categoria: rule.cat, subcategoria: rule.sub, confianca: 'regra' }
    }
    // 3. Valor positivo = receita
    if (valor > 0) return { categoria: 'Receita', subcategoria: 'Outros', confianca: 'baixa' }
    return { categoria: 'Outros', subcategoria: 'Não identificado', confianca: 'baixa' }
  }

  // ── Classificar via API Claude (para transações com confiança baixa) ──
  async function classifyWithAI(items) {
    if (items.length === 0) return []
    setClassifying(true)
    try {
      const regras = Object.entries(learned).map(([pattern, data]) => ({
        pattern, categoria: data.categoria, subcategoria: data.subcategoria, confirmacoes: data.count || 1
      }))
      const res = await fetch('/api/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transacoes: items, regras })
      })
      if (res.ok) {
        const { classificacoes } = await res.json()
        return classificacoes || []
      }
    } catch (err) {
      console.warn('[MAXXXI] API classificar indisponível, usando heurísticas:', err.message)
    } finally {
      setClassifying(false)
    }
    return []
  }

  // ── Parsear valor brasileiro: "1.234,56" ou "-R$ 1.234,56" → number ──
  function parseValorBR(str) {
    if (!str) return NaN
    let s = String(str).trim()
    // Detectar sinal negativo
    const negativo = s.startsWith('-') || s.includes('(') || s.toLowerCase().includes('deb') || s.toLowerCase().includes('saida')
    // Remover tudo que não é dígito, vírgula, ponto ou sinal
    s = s.replace(/[^0-9.,\-]/g, '')
    // Se tem formato BR "1.234,56": remover pontos de milhar, trocar vírgula por ponto
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.')
    }
    const num = parseFloat(s)
    if (isNaN(num)) return NaN
    return negativo && num > 0 ? -num : num
  }

  // ── Detectar separador do CSV ──
  function detectarSeparador(texto) {
    const primeiraLinha = texto.split('\n')[0] || ''
    const semis = (primeiraLinha.match(/;/g) || []).length
    const tabs = (primeiraLinha.match(/\t/g) || []).length
    const commas = (primeiraLinha.match(/,/g) || []).length
    if (semis >= 2) return ';'
    if (tabs >= 2) return '\t'
    return ','
  }

  // ── Parsear CSV / texto ──
  function parsearTexto(texto, nomeArquivo) {
    const linhas = texto.split('\n').filter(l => l.trim())
    if (linhas.length === 0) return []
    const sep = detectarSeparador(texto)
    const novas = []

    // Detectar se primeira linha é header
    const primeiraLinha = linhas[0].toLowerCase()
    const ehHeader = /^data|^date|^hist|^lanc|^descri/i.test(primeiraLinha)
    const startIdx = ehHeader ? 1 : 0

    // Detectar índices de colunas pelo header
    let colData = 0, colDesc = 1, colValor = -1
    if (ehHeader) {
      const headers = linhas[0].split(sep).map(h => h.trim().toLowerCase())
      colData = headers.findIndex(h => /^data|^date/.test(h))
      colDesc = headers.findIndex(h => /descri|histor|lanc|memo|detalhe|titulo/.test(h))
      colValor = headers.findIndex(h => /valor|value|amount|quantia|total/.test(h))
      if (colData < 0) colData = 0
      if (colDesc < 0) colDesc = 1
      if (colValor < 0) colValor = headers.length - 1
    }

    for (let i = startIdx; i < linhas.length; i++) {
      const linha = linhas[i]
      let parts
      if (sep === ',') {
        // CSV com vírgula: cuidado com valores "1.234,56"
        // Usar regex que respeita aspas
        parts = linha.match(/(".*?"|[^,]+)/g)?.map(p => p.replace(/^"|"$/g, '').trim()) || []
      } else {
        parts = linha.split(sep).map(p => p.trim())
      }
      if (parts.length < 2) continue

      let data = '', descricao = '', valor = 0

      // Se temos índices de colunas do header
      if (ehHeader && colValor >= 0) {
        data = parts[colData] || ''
        descricao = parts[colDesc] || ''
        valor = parseValorBR(parts[colValor])
        if (isNaN(valor)) valor = 0
      } else {
        // Heurística: detectar data no primeiro campo
        const dateMatch = parts[0].match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{2})/)
        if (dateMatch) {
          data = dateMatch[1]
          // Tentar valor no último campo
          valor = parseValorBR(parts[parts.length - 1])
          if (isNaN(valor)) {
            valor = parseValorBR(parts[parts.length - 2])
            descricao = parts.slice(1, -2).join(' ').trim() || parts[1] || ''
          } else {
            descricao = parts.slice(1, -1).join(' ').trim() || parts[1] || ''
          }
          if (isNaN(valor)) valor = 0
        } else {
          // Sem data — descrição + valor
          valor = parseValorBR(parts[parts.length - 1])
          if (isNaN(valor)) valor = 0
          descricao = parts.slice(0, -1).join(' ').trim()
          data = new Date().toLocaleDateString('pt-BR')
        }
      }

      // Limpar data
      if (!data) data = new Date().toLocaleDateString('pt-BR')
      // Limpar descrição
      descricao = descricao.replace(/"/g, '').trim()
      if (!descricao || descricao.length < 2) continue
      if (/^data$|^descri|^valor$|^hist|^lancamento|^saldo/i.test(descricao)) continue

      const classificacao = localClassify(descricao, valor)
      novas.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        data, descricao, valor,
        categoria: classificacao.categoria,
        subcategoria: classificacao.subcategoria,
        confianca: classificacao.confianca,
        status: classificacao.confianca === 'alta' ? 'validado' : 'pendente',
        origem: nomeArquivo || 'extrato',
        created_at: new Date().toISOString(),
      })
    }
    return novas
  }

  // ── Parsear Excel (.xlsx, .xls) ──
  async function parsearExcel(arrayBuffer, nomeArquivo) {
    const XLSX = await loadXLSX()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    if (rows.length < 2) return []

    // Detectar colunas por header
    const header = rows[0].map(h => String(h).toLowerCase().trim())
    let colData = header.findIndex(h => /^data|date/i.test(h))
    let colDesc = header.findIndex(h => /descri|histor|lanc|memo|detalhe/i.test(h))
    let colValor = header.findIndex(h => /valor|value|amount|quantia/i.test(h))
    // Fallback: assume primeira=data, segunda=descricao, terceira=valor
    if (colData < 0) colData = 0
    if (colDesc < 0) colDesc = 1
    if (colValor < 0) colValor = rows[0].length - 1

    const novas = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length < 2) continue
      let data = String(row[colData] || '').trim()
      const descricao = String(row[colDesc] || '').trim()
      let valor = 0
      const rawVal = String(row[colValor] || '0')
      valor = parseFloat(rawVal.replace(/[R$\s.]/g, '').replace(',', '.')) || 0

      if (!descricao || descricao.length < 2) continue
      if (/^data$|^descri|^valor$|^hist/i.test(descricao)) continue

      // Converter data Excel serial number
      if (typeof row[colData] === 'number' && row[colData] > 30000) {
        const d = XLSX.SSF.parse_date_code(row[colData])
        data = `${String(d.d).padStart(2,'0')}/${String(d.m).padStart(2,'0')}/${d.y}`
      }
      if (!data) data = new Date().toLocaleDateString('pt-BR')

      const classificacao = localClassify(descricao, valor)
      novas.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        data, descricao, valor,
        categoria: classificacao.categoria, subcategoria: classificacao.subcategoria,
        confianca: classificacao.confianca,
        status: classificacao.confianca === 'alta' ? 'validado' : 'pendente',
        origem: nomeArquivo, created_at: new Date().toISOString(),
      })
    }
    return novas
  }

  // ── Parsear Word (.docx) via mammoth ──
  async function parsearWord(arrayBuffer, nomeArquivo) {
    const mammothLib = await loadMammoth()
    const result = await mammothLib.extractRawText({ arrayBuffer })
    return result.value || ''
  }

  // ── Classificar texto bruto via API (para PDF/Word) ──
  async function classifyTextWithAI(textoBruto) {
    setClassifying(true)
    try {
      const regras = Object.entries(learned).map(([pattern, data]) => ({
        pattern, categoria: data.categoria, subcategoria: data.subcategoria, confirmacoes: data.count || 1
      }))
      const res = await fetch('/api/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto_bruto: textoBruto, regras })
      })
      if (res.ok) {
        const { classificacoes } = await res.json()
        return (classificacoes || []).map(c => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          data: c.data || new Date().toLocaleDateString('pt-BR'),
          descricao: c.descricao || '',
          valor: c.valor || 0,
          categoria: c.categoria || 'Outros',
          subcategoria: c.subcategoria || '',
          confianca: 'ia',
          status: 'pendente',
          origem: 'ia-texto',
          created_at: new Date().toISOString(),
        }))
      }
    } catch (err) {
      console.warn('[MAXXXI] Erro ao classificar texto:', err.message)
    } finally { setClassifying(false) }
    return []
  }

  // ── Classificar imagem via API (OCR + classificação) ──
  async function classifyImageWithAI(base64, mimeType) {
    setClassifying(true)
    try {
      const regras = Object.entries(learned).map(([pattern, data]) => ({
        pattern, categoria: data.categoria, subcategoria: data.subcategoria, confirmacoes: data.count || 1
      }))
      const res = await fetch('/api/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagem_base64: base64, mime_type: mimeType, regras })
      })
      if (res.ok) {
        const { classificacoes } = await res.json()
        return (classificacoes || []).map(c => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          data: c.data || new Date().toLocaleDateString('pt-BR'),
          descricao: c.descricao || '',
          valor: c.valor || 0,
          categoria: c.categoria || 'Outros',
          subcategoria: c.subcategoria || '',
          confianca: 'ia',
          status: 'pendente',
          origem: 'ia-imagem',
          created_at: new Date().toISOString(),
        }))
      }
    } catch (err) {
      console.warn('[MAXXXI] Erro ao classificar imagem:', err.message)
    } finally { setClassifying(false) }
    return []
  }

  // ── Finalizar upload: classificar baixa confiança + salvar ──
  async function finalizarUpload(novas, nomeArquivo) {
    // Classificar transações de baixa confiança via IA
    const baixaConfianca = novas.filter(t => t.confianca === 'baixa')
    if (baixaConfianca.length > 0) {
      const aiResults = await classifyWithAI(baixaConfianca)
      if (aiResults.length > 0) {
        for (const ai of aiResults) {
          const idx = novas.findIndex(t => t.id === ai.id)
          if (idx >= 0 && ai.categoria) {
            novas[idx].categoria = ai.categoria
            novas[idx].subcategoria = ai.subcategoria || ''
            novas[idx].confianca = 'ia'
          }
        }
      }
    }

    const newHist = {
      id: Date.now().toString(), arquivo: nomeArquivo,
      banco: detectarBanco(nomeArquivo), qtd: novas.length, data: new Date().toISOString(),
    }
    setHistorico(prev => [newHist, ...prev])
    setTransacoes(prev => [...novas, ...prev])
    setTab('validacao')
    // Sync para Supabase em background
    syncToSupabase(novas, null, [newHist])
  }

  // ── Upload de arquivo (multi-formato) ──
  async function handleUpload(e) {
    const file = e.target?.files?.[0] || e
    if (!file) return
    setUploading(true)

    const ext = (file.name || '').split('.').pop().toLowerCase()
    const nome = file.name || 'extrato'

    try {
      // ── CSV / TXT ──
      if (ext === 'csv' || ext === 'txt' || ext === 'ofx') {
        const text = await readFileAsText(file)
        const novas = parsearTexto(text, nome)
        if (novas.length === 0) { alert('Nenhuma transação encontrada no arquivo.'); setUploading(false); return }
        await finalizarUpload(novas, nome)
      }
      // ── Excel ──
      else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await readFileAsArrayBuffer(file)
        const novas = parsearExcel(buf, nome)
        if (novas.length === 0) { alert('Nenhuma transação encontrada na planilha.'); setUploading(false); return }
        await finalizarUpload(novas, nome)
      }
      // ── PDF ──
      else if (ext === 'pdf') {
        const buf = await readFileAsArrayBuffer(file)

        // Caminho 1: tentar extrair texto com pdfjs
        const text = await extractPdfText(buf)
        if (text && text.length > 30) {
          const novas = parsearTexto(text, nome)
          if (novas.length > 0) {
            await finalizarUpload(novas, nome)
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
            return
          }
          // Texto extraído mas sem transações estruturadas → enviar para IA
          const iaNovas = await classifyTextWithAI(text)
          if (iaNovas.length > 0) {
            await finalizarUpload(iaNovas, nome)
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ''
            return
          }
        }

        // Caminho 2: pdfjs falhou ou texto insuficiente → enviar como imagem para Claude Vision
        const base64 = await readFileAsBase64(file)
        const iaNovas = await classifyImageWithAI(base64, 'application/pdf')
        if (iaNovas.length > 0) {
          await finalizarUpload(iaNovas, nome)
        } else {
          alert('MAXXXI não conseguiu extrair transações deste PDF. Tente exportar como CSV no seu banco.')
        }
      }
      // ── Word (.docx) ──
      else if (ext === 'docx') {
        const buf = await readFileAsArrayBuffer(file)
        const text = await parsearWord(buf, nome)
        if (!text || text.length < 10) { alert('Não foi possível extrair texto do documento.'); setUploading(false); return }
        const novas = parsearTexto(text, nome)
        if (novas.length > 0) {
          await finalizarUpload(novas, nome)
        } else {
          const iaNovas = await classifyTextWithAI(text)
          if (iaNovas.length === 0) { alert('MAXXXI não conseguiu identificar transações no documento.'); setUploading(false); return }
          await finalizarUpload(iaNovas, nome)
        }
      }
      // ── Imagem (JPG/PNG) ──
      else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        const base64 = await readFileAsBase64(file)
        const mimeType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`
        const iaNovas = await classifyImageWithAI(base64, mimeType)
        if (iaNovas.length === 0) { alert('MAXXXI não conseguiu identificar transações na imagem.'); setUploading(false); return }
        await finalizarUpload(iaNovas, nome)
      }
      else {
        alert(`Formato .${ext} não suportado. Use CSV, Excel, PDF, Word ou imagem.`)
      }
    } catch (err) {
      console.error('[MAXXXI] Erro no upload:', err)
      alert('Erro ao processar arquivo: ' + err.message)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Helpers de leitura ──
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsText(file, 'UTF-8')
    })
  }
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsArrayBuffer(file)
    })
  }
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => {
        const result = r.result
        // Remover prefixo data:image/...;base64,
        resolve(result.split(',')[1] || result)
      }
      r.onerror = reject; r.readAsDataURL(file)
    })
  }
  async function extractPdfText(arrayBuffer) {
    try {
      const pdfjsLib = await import('pdfjs-dist')
      // Worker inline — evita problemas de CORS
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
      const pdf = await loadingTask.promise
      let text = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        // Preservar quebras de linha baseadas na posição Y dos items
        let lastY = null
        const lineItems = []
        for (const item of content.items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
            lineItems.push('\n')
          }
          lineItems.push(item.str)
          lastY = item.transform[5]
        }
        text += lineItems.join(' ').replace(/ \n /g, '\n') + '\n'
      }
      return text.trim()
    } catch (err) {
      console.warn('[MAXXXI] pdfjs falhou:', err.message)
      return ''
    }
  }

  function detectarBanco(nome) {
    const n = (nome || '').toLowerCase()
    if (n.includes('nubank')) return 'Nubank'
    if (n.includes('c6')) return 'C6 Bank'
    if (n.includes('inter')) return 'Inter'
    if (n.includes('itau') || n.includes('itaú')) return 'Itaú'
    if (n.includes('bradesco')) return 'Bradesco'
    if (n.includes('caixa') || n.includes('cef')) return 'Caixa'
    if (n.includes('santander')) return 'Santander'
    if (n.includes('btg')) return 'BTG Pactual'
    return 'Não identificado'
  }

  // ── Drag & Drop ──
  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); dropRef.current?.classList.add('drag-active') }
  function handleDragLeave(e) { e.preventDefault(); dropRef.current?.classList.remove('drag-active') }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation(); dropRef.current?.classList.remove('drag-active')
    const file = e.dataTransfer?.files?.[0]
    if (file) handleUpload(file)
  }

  // ── Validar transação ──
  function validar(idx) {
    setTransacoes(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], status: 'validado' }
      const key = next[idx].descricao.toLowerCase().trim()
      const newLearned = { ...learned, [key]: { categoria: next[idx].categoria, subcategoria: next[idx].subcategoria, count: (learned[key]?.count || 0) + 1 } }
      setLearned(newLearned)
      syncToSupabase([next[idx]], newLearned, null)
      return next
    })
  }

  // ── Validar selecionados ou todos ──
  function validarBatch(onlySelected) {
    const newLearned = { ...learned }
    setTransacoes(prev => {
      const next = prev.map((t, i) => {
        if (t.status !== 'pendente') return t
        if (onlySelected && !selected[i]) return t
        const key = t.descricao.toLowerCase().trim()
        newLearned[key] = { categoria: t.categoria, subcategoria: t.subcategoria, count: (newLearned[key]?.count || 0) + 1 }
        return { ...t, status: 'validado' }
      })
      setLearned(newLearned)
      syncToSupabase(next.filter(t => t.status === 'validado'), newLearned, null)
      return next
    })
    setSelected({})
    setSelectedAll(false)
  }

  // ── Corrigir ──
  function salvarCorrecao(idx) {
    if (!editCat) return
    setTransacoes(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], categoria: editCat, subcategoria: editSub || CATEGORIAS_GP[editCat]?.sub[0] || '', status: 'corrigido' }
      const key = next[idx].descricao.toLowerCase().trim()
      const newLearned = { ...learned, [key]: { categoria: editCat, subcategoria: editSub || '', count: (learned[key]?.count || 0) + 1 } }
      setLearned(newLearned)
      syncToSupabase([next[idx]], newLearned, null)
      return next
    })
    setEditIdx(null); setEditCat(''); setEditSub('')
  }

  function remover(idx) { setTransacoes(prev => prev.filter((_, i) => i !== idx)) }

  // ── Toggle seleção ──
  function toggleSelect(idx) { setSelected(p => ({ ...p, [idx]: !p[idx] })) }
  function toggleSelectAll() {
    if (selectedAll) { setSelected({}); setSelectedAll(false) }
    else {
      const sel = {}
      transacoes.forEach((t, i) => { if (t.status === 'pendente') sel[i] = true })
      setSelected(sel); setSelectedAll(true)
    }
  }

  // ── Filtrar ──
  let filtered = transacoes
  if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus)
  if (filterCat !== 'all') filtered = filtered.filter(t => t.categoria === filterCat)

  // ── Resumo ──
  const totalReceitas = transacoes.filter(t => t.valor > 0).reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0)
  const saldo = totalReceitas - totalDespesas
  const pendentes = transacoes.filter(t => t.status === 'pendente').length
  const selectedCount = Object.values(selected).filter(Boolean).length
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Top categorias de gasto
  const catTotals = {}
  transacoes.filter(t => t.valor < 0 && t.categoria !== 'Transferência').forEach(t => {
    catTotals[t.categoria] = (catTotals[t.categoria] || 0) + Math.abs(t.valor)
  })
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCats[0]?.[1] || 1

  return (
    <div>
      {/* KPIs */}
      <div className="g4 mb">
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Total Receitas</div>
          <div className="val txt-green" style={{ fontSize: 20 }}>{fmt(totalReceitas)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Total Despesas</div>
          <div className="val txt-red" style={{ fontSize: 20 }}>{fmt(totalDespesas)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Saldo</div>
          <div className="val" style={{ fontSize: 20, color: saldo >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(saldo)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">MAXXXI Aprendeu</div>
          <div className="val txt-purple" style={{ fontSize: 20 }}>{Object.keys(learned).length}</div>
          <div className="delta-neu">padrões · {pendentes} pendente{pendentes !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Abas internas */}
      <div className="tab-nav mb" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'upload', label: '📎 Importar' },
          { key: 'validacao', label: `✅ Validação ${pendentes > 0 ? `(${pendentes})` : ''}` },
          { key: 'resumo', label: '📊 Resumo' },
          { key: 'historico', label: '📂 Histórico' },
          { key: 'regras', label: `🤖 Regras (${Object.keys(learned).length})` },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── ABA UPLOAD ── */}
      {tab === 'upload' && (
        <div className="module-card">
          <div ref={dropRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border2)', borderRadius: 12, padding: 40,
              textAlign: 'center', transition: '.2s', cursor: 'pointer',
            }}
            onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {uploading ? '⏳ Processando extrato...' : classifying ? '🤖 MAXXXI classificando...' : 'Arraste seu extrato aqui'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 16 }}>ou clique para selecionar</div>
            <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
              Formatos: <strong>CSV</strong> · <strong>Excel</strong> · <strong>PDF</strong> · <strong>Imagem</strong> · <strong>Word</strong>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.docx" onChange={handleUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 16, lineHeight: 1.8 }}>
            💡 <strong>Como funciona:</strong><br />
            1. Importe o extrato do seu banco (CSV, Excel, PDF, foto ou Word)<br />
            2. MAXXXI classifica automaticamente cada transação (heurísticas + IA)<br />
            3. Revise e valide na aba <strong>Validação</strong><br />
            4. O que você validar vira regra — na próxima vez, já classifica sozinho
          </div>
        </div>
      )}

      {/* ── ABA VALIDAÇÃO ── */}
      {tab === 'validacao' && (
        <>
          {/* Barra de ações */}
          <div className="module-card" style={{ marginBottom: 12, padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {pendentes > 0 && (
                <>
                  <button className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, var(--green), #059669)' }} onClick={() => validarBatch(false)}>
                    ✅ Validar Todos ({pendentes})
                  </button>
                  {selectedCount > 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => validarBatch(true)}>
                      ✅ Validar Selecionados ({selectedCount})
                    </button>
                  )}
                </>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <select className="inp" style={{ width: 130, fontSize: 11, padding: '4px 8px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">Todos status</option>
                  <option value="pendente">Pendentes</option>
                  <option value="validado">Validados</option>
                  <option value="corrigido">Corrigidos</option>
                </select>
                <select className="inp" style={{ width: 140, fontSize: 11, padding: '4px 8px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="all">Todas categorias</option>
                  {Object.keys(CATEGORIAS_GP).map(c => <option key={c} value={c}>{CATEGORIAS_GP[c].icon} {c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="module-card" style={{ overflowX: 'auto' }}>
              <table className="exec-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}><input type="checkbox" checked={selectedAll} onChange={toggleSelectAll} /></th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Categoria</th>
                    <th>Sub</th>
                    <th>Conf.</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, fi) => {
                    const realIdx = transacoes.indexOf(t)
                    const st = STATUS_COLORS[t.status] || STATUS_COLORS.pendente
                    const conf = CONFIANCA_BADGE[t.confianca] || CONFIANCA_BADGE.baixa
                    const isEditing = editIdx === realIdx
                    return (
                      <tr key={t.id} style={{
                        background: isEditing ? 'rgba(59,130,246,.06)' : t.status === 'pendente' && t.confianca === 'baixa' ? 'rgba(245,158,11,.04)' : undefined
                      }}>
                        <td><input type="checkbox" checked={!!selected[realIdx]} onChange={() => toggleSelect(realIdx)} disabled={t.status !== 'pendente'} /></td>
                        <td style={{ fontSize: 11, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{t.data}</td>
                        <td style={{ fontSize: 12, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.descricao}>{t.descricao}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: t.valor >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {t.valor >= 0 ? '+' : ''}{fmt(t.valor)}
                        </td>
                        <td>
                          {isEditing ? (
                            <select className="inp" style={{ fontSize: 11, padding: '2px 4px', width: 120 }} value={editCat} onChange={e => { setEditCat(e.target.value); setEditSub('') }}>
                              <option value="">—</option>
                              {Object.keys(CATEGORIAS_GP).map(c => <option key={c} value={c}>{CATEGORIAS_GP[c].icon} {c}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontSize: 11 }}>{CATEGORIAS_GP[t.categoria]?.icon || '📋'} {t.categoria}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select className="inp" style={{ fontSize: 11, padding: '2px 4px', width: 110 }} value={editSub} onChange={e => setEditSub(e.target.value)}>
                              <option value="">—</option>
                              {(CATEGORIAS_GP[editCat]?.sub || []).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{t.subcategoria}</span>
                          )}
                        </td>
                        <td><span title={conf.label} style={{ fontSize: 12 }}>{conf.icon}</span></td>
                        <td><span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {isEditing ? (
                              <>
                                <button className="btn btn-sm btn-done" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => salvarCorrecao(realIdx)}>Salvar</button>
                                <button className="btn btn-sm btn-secondary" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => setEditIdx(null)}>×</button>
                              </>
                            ) : (
                              <>
                                {t.status === 'pendente' && <button className="btn btn-sm btn-done" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => validar(realIdx)} title="Validar">✅</button>}
                                <button className="btn btn-sm btn-secondary" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => { setEditIdx(realIdx); setEditCat(t.categoria); setEditSub(t.subcategoria) }} title="Corrigir">✏️</button>
                                <button className="btn btn-sm btn-del" style={{ fontSize: 10, padding: '2px 6px' }} onClick={() => remover(realIdx)} title="Remover">🗑</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="module-card">
              <div className="empty-state" style={{ padding: 40 }}>
                <div style={{ fontSize: 48 }}>📋</div>
                <p style={{ color: 'var(--tx2)', marginTop: 12 }}>{transacoes.length === 0 ? 'Nenhum extrato importado ainda' : 'Nenhuma transação neste filtro'}</p>
                {transacoes.length === 0 && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('upload')}>📎 Importar Extrato</button>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ABA RESUMO ── */}
      {tab === 'resumo' && (
        <>
          {topCats.length > 0 ? (
            <div className="module-card mb">
              <div className="module-card-title">🏆 Top Categorias de Gasto</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCats.map(([cat, total]) => {
                  const pct = ((total / maxCat) * 100).toFixed(0)
                  const catInfo = CATEGORIAS_GP[cat] || { icon: '📋' }
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{catInfo.icon} {cat}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{fmt(total)}</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--red), #f87171)', borderRadius: 4, transition: '.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="module-card"><div className="empty-state" style={{ padding: 30 }}><p>Importe um extrato para ver o resumo</p></div></div>
          )}

          {/* Resumo por categoria */}
          {transacoes.length > 0 && (
            <div className="module-card">
              <div className="module-card-title">📊 Todas as Categorias</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                {Object.keys(CATEGORIAS_GP).map(cat => {
                  const items = transacoes.filter(t => t.categoria === cat)
                  if (items.length === 0) return null
                  const total = items.reduce((s, t) => s + Math.abs(t.valor), 0)
                  const isReceita = cat === 'Receita'
                  return (
                    <div key={cat} className="card" style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{CATEGORIAS_GP[cat].icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{cat}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isReceita ? 'var(--green)' : 'var(--text)' }}>{fmt(total)}</div>
                      <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{items.length} transaç{items.length !== 1 ? 'ões' : 'ão'}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ABA HISTÓRICO ── */}
      {tab === 'historico' && (
        <div className="module-card">
          <div className="module-card-title">📂 Extratos Importados ({historico.length})</div>
          {historico.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}><p>Nenhum extrato importado ainda</p></div>
          ) : (
            <table className="exec-table">
              <thead><tr><th>Arquivo</th><th>Banco</th><th>Transações</th><th>Data</th></tr></thead>
              <tbody>
                {historico.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 500 }}>📄 {h.arquivo}</td>
                    <td><span className="badge" style={{ background: 'rgba(59,130,246,.12)', color: 'var(--blue)' }}>{h.banco}</span></td>
                    <td>{h.qtd}</td>
                    <td style={{ fontSize: 11, color: 'var(--tx3)' }}>{new Date(h.data).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ABA REGRAS APRENDIDAS ── */}
      {tab === 'regras' && (
        <div className="module-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="module-card-title" style={{ margin: 0 }}>🤖 Regras Aprendidas ({Object.keys(learned).length})</div>
            {Object.keys(learned).length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Limpar todas as regras aprendidas?')) { setLearned({}); } }}>🗑 Limpar Regras</button>
            )}
          </div>
          {Object.keys(learned).length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>MAXXXI ainda não aprendeu nenhum padrão</p>
              <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>Importe um extrato e valide as transações — ele vai memorizar</p>
            </div>
          ) : (
            <table className="exec-table">
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Subcategoria</th><th>Confirmações</th></tr></thead>
              <tbody>
                {Object.entries(learned).sort((a, b) => (b[1].count || 1) - (a[1].count || 1)).map(([key, data]) => (
                  <tr key={key}>
                    <td style={{ fontSize: 12, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={key}>{key}</td>
                    <td><span style={{ fontSize: 12 }}>{CATEGORIAS_GP[data.categoria]?.icon || '📋'} {data.categoria}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--tx3)' }}>{data.subcategoria}</td>
                    <td><span className="badge" style={{ background: 'rgba(16,185,129,.12)', color: 'var(--green)' }}>{data.count || 1}x</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
