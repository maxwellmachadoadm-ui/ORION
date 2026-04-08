import { useState, useEffect, useRef } from 'react'

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
  const [transacoes, setTransacoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_extratos_gp') || '[]') } catch { return [] }
  })
  const [learned, setLearned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_extratos_learned') || '{}') } catch { return {} }
  })
  const [historico, setHistorico] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_extratos_hist') || '[]') } catch { return [] }
  })
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
  const fileRef = useRef(null)
  const dropRef = useRef(null)

  // Persistir
  useEffect(() => { localStorage.setItem('orion_extratos_gp', JSON.stringify(transacoes)) }, [transacoes])
  useEffect(() => { localStorage.setItem('orion_extratos_learned', JSON.stringify(learned)) }, [learned])
  useEffect(() => { localStorage.setItem('orion_extratos_hist', JSON.stringify(historico)) }, [historico])

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

  // ── Parsear CSV / texto ──
  function parsearTexto(texto, nomeArquivo) {
    const linhas = texto.split('\n').filter(l => l.trim())
    const novas = []

    for (const linha of linhas) {
      const parts = linha.split(/[;\t]/).map(p => p.trim())
      if (parts.length < 2) {
        // Tentar vírgula (cuidado com valores "1.234,56")
        const combParts = linha.split(',').map(p => p.trim())
        if (combParts.length >= 3) parts.splice(0, parts.length, ...combParts)
        else continue
      }

      let data = '', descricao = '', valor = 0

      // Detectar data
      const dateMatch = parts[0].match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{2})/)
      if (dateMatch) {
        data = dateMatch[1]
        // Pegar descrição (tudo entre data e valor)
        const valStr = parts[parts.length - 1].replace(/[R$\s.]/g, '').replace(',', '.')
        valor = parseFloat(valStr)
        if (isNaN(valor)) {
          // Valor pode estar no penúltimo campo
          const valStr2 = parts[parts.length - 2]?.replace(/[R$\s.]/g, '').replace(',', '.')
          valor = parseFloat(valStr2) || 0
          descricao = parts.slice(1, -2).join(' ').trim() || parts[1]
        } else {
          descricao = parts.slice(1, -1).join(' ').trim() || parts[1]
        }
      } else {
        // Sem data — pegar descrição e valor
        const valStr = parts[parts.length - 1].replace(/[R$\s.]/g, '').replace(',', '.')
        valor = parseFloat(valStr) || 0
        descricao = parts.slice(0, -1).join(' ').trim()
        data = new Date().toLocaleDateString('pt-BR')
      }

      if (!descricao || descricao.length < 2) continue
      // Ignorar headers
      if (/^data$|^descri|^valor$|^hist|^lancamento/i.test(descricao)) continue

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

  // ── Upload de arquivo ──
  async function handleUpload(e) {
    const file = e.target?.files?.[0] || e
    if (!file) return
    setUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result
      const novas = parsearTexto(text, file.name)

      if (novas.length === 0) {
        alert('Nenhuma transação encontrada. Formato aceito: CSV com colunas Data;Descrição;Valor')
        setUploading(false)
        return
      }

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

      // Salvar histórico do extrato
      setHistorico(prev => [{
        id: Date.now().toString(),
        arquivo: file.name,
        banco: detectarBanco(file.name),
        qtd: novas.length,
        data: new Date().toISOString(),
      }, ...prev])

      setTransacoes(prev => [...novas, ...prev])
      setUploading(false)
      setTab('validacao')
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.onerror = () => { alert('Erro ao ler arquivo'); setUploading(false) }
    reader.readAsText(file, 'UTF-8')
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
      setLearned(p => ({ ...p, [key]: { categoria: next[idx].categoria, subcategoria: next[idx].subcategoria, count: (p[key]?.count || 0) + 1 } }))
      return next
    })
  }

  // ── Validar selecionados ou todos ──
  function validarBatch(onlySelected) {
    setTransacoes(prev => {
      return prev.map((t, i) => {
        if (t.status !== 'pendente') return t
        if (onlySelected && !selected[i]) return t
        const key = t.descricao.toLowerCase().trim()
        setLearned(p => ({ ...p, [key]: { categoria: t.categoria, subcategoria: t.subcategoria, count: (p[key]?.count || 0) + 1 } }))
        return { ...t, status: 'validado' }
      })
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
      setLearned(p => ({ ...p, [key]: { categoria: editCat, subcategoria: editSub || '', count: (p[key]?.count || 0) + 1 } }))
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
              Formatos aceitos: <strong>CSV</strong>, <strong>TXT</strong> · Colunas: <strong>Data;Descrição;Valor</strong>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.ofx" onChange={handleUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 16, lineHeight: 1.8 }}>
            💡 <strong>Como funciona:</strong><br />
            1. Importe o CSV do seu banco<br />
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
