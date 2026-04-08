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
  'Outros':          { icon: '📋', sub: ['Diversos', 'Não identificado'] },
}

const STATUS_COLORS = {
  pendente: { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: 'Pendente' },
  validado: { bg: 'rgba(16,185,129,.12)', color: '#10b981', label: 'Validado' },
  corrigido: { bg: 'rgba(59,130,246,.12)', color: '#3b82f6', label: 'Corrigido' },
}

export default function ExtratosIA() {
  const [transacoes, setTransacoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_extratos_gp') || '[]') } catch { return [] }
  })
  const [learned, setLearned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orion_extratos_learned') || '{}') } catch { return {} }
  })
  const [uploading, setUploading] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [editCat, setEditCat] = useState('')
  const [editSub, setEditSub] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const fileRef = useRef(null)

  // Persistir
  useEffect(() => {
    localStorage.setItem('orion_extratos_gp', JSON.stringify(transacoes))
  }, [transacoes])
  useEffect(() => {
    localStorage.setItem('orion_extratos_learned', JSON.stringify(learned))
  }, [learned])

  // ── Classificar automaticamente baseado no aprendizado ──
  function autoClassify(descricao, valor) {
    const key = descricao.toLowerCase().trim()
    // Busca exata
    if (learned[key]) return { categoria: learned[key].categoria, subcategoria: learned[key].subcategoria, confianca: 'alta' }
    // Busca parcial — verifica se alguma palavra-chave aprendida está contida
    for (const [learnedKey, data] of Object.entries(learned)) {
      if (key.includes(learnedKey) || learnedKey.includes(key)) {
        return { categoria: data.categoria, subcategoria: data.subcategoria, confianca: 'media' }
      }
    }
    // Heurísticas baseadas em palavras-chave
    const rules = [
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
      { test: /netflix|spotify|amazon.*prime|disney|hbo|youtube.*premium|apple.*tv/i, cat: 'Assinaturas', sub: 'Streaming' },
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
      { test: /seguro.*auto|porto.*seguro|tokio|liberty|azul.*seguros/i, cat: 'Transporte', sub: 'Seguro Auto' },
      { test: /cdb|lci|lca|tesouro|renda.*fixa/i, cat: 'Investimento', sub: 'Renda Fixa' },
      { test: /acoes|b3|corretora|xp|rico|clear|inter.*invest/i, cat: 'Investimento', sub: 'Renda Variável' },
      { test: /fii|fundo.*imob/i, cat: 'Investimento', sub: 'FII' },
      { test: /previdencia|pgbl|vgbl/i, cat: 'Investimento', sub: 'Previdência' },
    ]
    for (const rule of rules) {
      if (rule.test.test(key)) return { categoria: rule.cat, subcategoria: rule.sub, confianca: 'regra' }
    }
    // Heurística por valor
    if (valor > 0) return { categoria: 'Receita', subcategoria: 'Outros', confianca: 'baixa' }
    return { categoria: 'Outros', subcategoria: 'Não identificado', confianca: 'baixa' }
  }

  // ── Processar texto do extrato (CSV ou texto colado) ──
  function processarExtrato(texto) {
    const linhas = texto.split('\n').filter(l => l.trim())
    const novas = []
    for (const linha of linhas) {
      // Tentar parsear formatos comuns:
      // DD/MM/YYYY;Descrição;Valor ou DD/MM/YYYY,Descrição,Valor
      const parts = linha.split(/[;,\t]/).map(p => p.trim())
      if (parts.length < 2) continue

      let data = '', descricao = '', valor = 0

      // Detectar data (DD/MM/YYYY ou YYYY-MM-DD)
      const dateMatch = parts[0].match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/)
      if (dateMatch) {
        data = dateMatch[1]
        descricao = parts.slice(1, -1).join(' ').trim() || parts[1]
        const valStr = parts[parts.length - 1].replace(/[R$\s.]/g, '').replace(',', '.')
        valor = parseFloat(valStr) || 0
      } else {
        // Sem data — tentar Descrição;Valor
        descricao = parts.slice(0, -1).join(' ').trim()
        const valStr = parts[parts.length - 1].replace(/[R$\s.]/g, '').replace(',', '.')
        valor = parseFloat(valStr) || 0
        data = new Date().toLocaleDateString('pt-BR')
      }

      if (!descricao || descricao.length < 2) continue

      const classificacao = autoClassify(descricao, valor)
      novas.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        data,
        descricao,
        valor,
        categoria: classificacao.categoria,
        subcategoria: classificacao.subcategoria,
        confianca: classificacao.confianca,
        status: classificacao.confianca === 'alta' ? 'validado' : 'pendente',
        origem: 'extrato',
        created_at: new Date().toISOString(),
      })
    }
    return novas
  }

  // ── Upload de arquivo ──
  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      const novas = processarExtrato(text)
      if (novas.length === 0) {
        alert('Nenhuma transação encontrada no arquivo. Verifique o formato (CSV com separador ; ou ,)')
        setUploading(false)
        return
      }
      setTransacoes(prev => [...novas, ...prev])
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
    reader.onerror = () => { alert('Erro ao ler arquivo'); setUploading(false) }
    reader.readAsText(file, 'UTF-8')
  }

  // ── Validar transação (MAXXXI aprende) ──
  function validar(idx) {
    setTransacoes(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], status: 'validado' }
      // MAXXXI aprende
      const key = next[idx].descricao.toLowerCase().trim()
      setLearned(prev => ({
        ...prev,
        [key]: { categoria: next[idx].categoria, subcategoria: next[idx].subcategoria, count: (prev[key]?.count || 0) + 1 }
      }))
      return next
    })
  }

  // ── Validar todos pendentes ──
  function validarTodos() {
    setTransacoes(prev => {
      const next = prev.map(t => {
        if (t.status === 'pendente') {
          const key = t.descricao.toLowerCase().trim()
          setLearned(p => ({ ...p, [key]: { categoria: t.categoria, subcategoria: t.subcategoria, count: (p[key]?.count || 0) + 1 } }))
          return { ...t, status: 'validado' }
        }
        return t
      })
      return next
    })
  }

  // ── Corrigir classificação ──
  function salvarCorrecao(idx) {
    if (!editCat) return
    setTransacoes(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], categoria: editCat, subcategoria: editSub || CATEGORIAS_GP[editCat]?.sub[0] || '', status: 'corrigido' }
      // MAXXXI aprende a correção
      const key = next[idx].descricao.toLowerCase().trim()
      setLearned(prev => ({ ...prev, [key]: { categoria: editCat, subcategoria: editSub || '', count: (prev[key]?.count || 0) + 1 } }))
      return next
    })
    setEditIdx(null)
    setEditCat('')
    setEditSub('')
  }

  // ── Remover ──
  function remover(idx) {
    setTransacoes(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Filtrar ──
  let filtered = transacoes
  if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus)
  if (filterCat !== 'all') filtered = filtered.filter(t => t.categoria === filterCat)

  // ── Resumo ──
  const totalReceitas = transacoes.filter(t => t.valor > 0).reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0)
  const pendentes = transacoes.filter(t => t.status === 'pendente').length
  const categorias = [...new Set(transacoes.map(t => t.categoria))]

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      {/* KPIs */}
      <div className="g4 mb">
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Transações</div>
          <div className="val txt-blue" style={{ fontSize: 22 }}>{transacoes.length}</div>
          <div className="delta-neu">{pendentes} pendente{pendentes !== 1 ? 's' : ''}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Receitas</div>
          <div className="val txt-green" style={{ fontSize: 22 }}>{fmt(totalReceitas)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">Despesas</div>
          <div className="val txt-red" style={{ fontSize: 22 }}>{fmt(totalDespesas)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="lbl">MAXXXI Aprendeu</div>
          <div className="val txt-purple" style={{ fontSize: 22 }}>{Object.keys(learned).length}</div>
          <div className="delta-neu">padrões memorizados</div>
        </div>
      </div>

      {/* Upload + Filtros */}
      <div className="module-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? '⏳ Processando...' : '📎 Importar Extrato (CSV)'}
            <input ref={fileRef} type="file" accept=".csv,.txt,.ofx" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {pendentes > 0 && (
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), #059669)' }} onClick={validarTodos}>
              ✅ Validar Todos ({pendentes})
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select className="inp" style={{ width: 140, fontSize: 12 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Todos status</option>
              <option value="pendente">Pendentes</option>
              <option value="validado">Validados</option>
              <option value="corrigido">Corrigidos</option>
            </select>
            <select className="inp" style={{ width: 150, fontSize: 12 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">Todas categorias</option>
              {Object.keys(CATEGORIAS_GP).map(c => <option key={c} value={c}>{CATEGORIAS_GP[c].icon} {c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 10 }}>
          💡 Formato aceito: CSV com colunas <strong>Data;Descrição;Valor</strong> (separador ; ou , ou tab). O MAXXXI classifica automaticamente e aprende com suas validações.
        </div>
      </div>

      {/* Tabela de transações */}
      {filtered.length > 0 ? (
        <div className="module-card">
          <div className="module-card-title">
            📋 Transações ({filtered.length})
            {filterStatus !== 'all' || filterCat !== 'all'
              ? <span style={{ fontSize: 11, color: 'var(--tx3)', marginLeft: 8 }}>(filtrado de {transacoes.length} total)</span>
              : null}
          </div>
          <table className="exec-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Categoria</th>
                <th>Sub</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => {
                const realIdx = transacoes.indexOf(t)
                const st = STATUS_COLORS[t.status] || STATUS_COLORS.pendente
                const isEditing = editIdx === realIdx
                return (
                  <tr key={t.id} style={{ background: isEditing ? 'rgba(59,130,246,.05)' : undefined }}>
                    <td style={{ fontSize: 12, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{t.data}</td>
                    <td style={{ fontSize: 13, fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: t.valor >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                      {t.valor >= 0 ? '+' : ''}{fmt(t.valor)}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="inp" style={{ fontSize: 11, padding: '2px 6px', width: 130 }} value={editCat} onChange={e => { setEditCat(e.target.value); setEditSub('') }}>
                          <option value="">Selecione</option>
                          {Object.keys(CATEGORIAS_GP).map(c => <option key={c} value={c}>{CATEGORIAS_GP[c].icon} {c}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{CATEGORIAS_GP[t.categoria]?.icon || '📋'} {t.categoria}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className="inp" style={{ fontSize: 11, padding: '2px 6px', width: 120 }} value={editSub} onChange={e => setEditSub(e.target.value)}>
                          <option value="">Selecione</option>
                          {(CATEGORIAS_GP[editCat]?.sub || []).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{t.subcategoria}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      {t.confianca && t.status === 'pendente' && (
                        <span style={{ fontSize: 9, color: 'var(--tx3)', marginLeft: 4 }}>
                          {t.confianca === 'alta' ? '🟢' : t.confianca === 'media' ? '🟡' : t.confianca === 'regra' ? '🔵' : '🔴'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {isEditing ? (
                          <>
                            <button className="btn btn-sm btn-done" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => salvarCorrecao(realIdx)}>Salvar</button>
                            <button className="btn btn-sm btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditIdx(null)}>×</button>
                          </>
                        ) : (
                          <>
                            {t.status === 'pendente' && (
                              <button className="btn btn-sm btn-done" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => validar(realIdx)} title="Validar classificação">✅</button>
                            )}
                            <button className="btn btn-sm btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => { setEditIdx(realIdx); setEditCat(t.categoria); setEditSub(t.subcategoria) }} title="Corrigir">✏️</button>
                            <button className="btn btn-sm btn-del" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => remover(realIdx)} title="Remover">🗑</button>
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
            <div className="icon" style={{ fontSize: 48 }}>🏦</div>
            <p style={{ fontSize: 14, color: 'var(--tx2)', marginTop: 12 }}>Nenhum extrato importado</p>
            <p style={{ fontSize: 12, color: 'var(--tx3)', maxWidth: 400, margin: '8px auto 0' }}>
              Importe um arquivo CSV do seu banco com as colunas <strong>Data;Descrição;Valor</strong>.
              O MAXXXI vai classificar automaticamente cada transação.
              Valide ou corrija — e ele aprenderá para as próximas vezes.
            </p>
          </div>
        </div>
      )}

      {/* Resumo por categoria */}
      {transacoes.length > 0 && (
        <div className="module-card" style={{ marginTop: 16 }}>
          <div className="module-card-title">📊 Resumo por Categoria</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {Object.keys(CATEGORIAS_GP).map(cat => {
              const items = transacoes.filter(t => t.categoria === cat)
              if (items.length === 0) return null
              const total = items.reduce((s, t) => s + Math.abs(t.valor), 0)
              return (
                <div key={cat} className="card" style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{CATEGORIAS_GP[cat].icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cat === 'Receita' ? 'var(--green)' : 'var(--text)' }}>{fmt(total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{items.length} transaç{items.length !== 1 ? 'ões' : 'ão'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
