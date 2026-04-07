import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { useNavigate } from 'react-router-dom'

// ── Log do MAXXXI ──
function logMaxxxiAction(userId, userName, message, mode, tokens) {
  try {
    const log = JSON.parse(localStorage.getItem('orion_maxxxi_log') || '[]')
    log.unshift({ timestamp: new Date().toISOString(), user_id: userId, user_name: userName, message, mode, tokens: tokens || null })
    localStorage.setItem('orion_maxxxi_log', JSON.stringify(log.slice(0, 500)))
  } catch (_) {}
}

// ── RAG de arquivos do DataContext/localStorage ──
function getArquivosContext(arquivos) {
  if (!arquivos?.length) return ''
  const summary = arquivos.slice(0, 20).map(a =>
    `- ${a.nome} (${(a.empresa_id || '').toUpperCase()}, ${a.mes_competencia || 'sem data'}, ${a.categoria || 'não classificado'})`
  ).join('\n')
  return `\nARQUIVOS CARREGADOS NO SISTEMA:\n${summary}\n`
}

// ── Classificação automática de despesas ──
function autoClassify(text) {
  const t = text.toLowerCase()
  if (t.includes('salário') || t.includes('folha') || t.includes('holerite')) return { categoria: 'PESSOAL', subcategoria: 'Salários' }
  if (t.includes('pró-labore') || t.includes('pro labore')) return { categoria: 'PESSOAL', subcategoria: 'Pró-labore' }
  if (t.includes('aluguel') || t.includes('locação')) return { categoria: 'ESCRITÓRIO', subcategoria: 'Aluguel' }
  if (t.includes('internet') || t.includes('telefone') || t.includes('tim ') || t.includes('vivo') || t.includes('claro')) return { categoria: 'ESCRITÓRIO', subcategoria: 'Internet / Telefone' }
  if (t.includes('material') && t.includes('limpeza')) return { categoria: 'ESCRITÓRIO', subcategoria: 'Material de Limpeza' }
  if (t.includes('material') && t.includes('consumo')) return { categoria: 'ESCRITÓRIO', subcategoria: 'Material de Consumo' }
  if (t.includes('instagram') || t.includes('facebook') || t.includes('tráfego') || t.includes('ads')) return { categoria: 'MARKETING', subcategoria: 'Redes Sociais' }
  if (t.includes('imposto') || t.includes('simples') || t.includes('das')) return { categoria: 'IMPOSTOS', subcategoria: 'Simples Nacional' }
  if (t.includes('tarifa') || t.includes('ted') || t.includes('doc')) return { categoria: 'FINANCEIRO', subcategoria: 'Tarifas Bancárias' }
  if (t.includes('honorário') || t.includes('mensalidade') || t.includes('contabilidade')) return { categoria: 'RECEITAS', subcategoria: 'Honorários / Mensalidades' }
  return null
}

// mantido para compatibilidade
function classifyExpense(text) {
  const result = autoClassify(text)
  return result ? `${result.categoria} / ${result.subcategoria}` : 'Outros'
}

function generateDailyBriefing(empresas, alerts, tarefas) {
  const hoje = new Date()
  const altasPend = tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'done').length
  const criticos = alerts.filter(a => a.level === 'critico').length

  let briefing = `📋 **BRIEFING DIÁRIO — ${hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}**\n\n`
  briefing += `**Situação do Ecossistema:**\n`
  empresas.filter(e => e.id !== 'gp').forEach(e => {
    const status = e.score >= 70 ? '🟢' : e.score >= 40 ? '🟡' : '🔴'
    const margem = e.faturamento > 0 ? ((e.resultado / e.faturamento) * 100).toFixed(0) : 0
    briefing += `${status} **${e.nome}**: Score ${e.score} | Margem ${margem}%\n`
  })
  briefing += `\n**Alertas Ativos:** ${criticos} críticos\n`
  briefing += `**Tarefas Urgentes:** ${altasPend} de alta prioridade\n\n`
  briefing += `**Prioridades para Hoje:**\n`
  const emAtencao = empresas.find(e => e.score < 60)
  briefing += `1. Verificar inadimplência de ${emAtencao?.nome || 'empresas em atenção'}\n`
  briefing += `2. Revisar ${altasPend} tarefas de alta prioridade\n`
  briefing += `3. Acompanhar pipeline de receita futura\n`
  return briefing
}

function buildCFOResponse(situation, risk, action, deadline) {
  return `**📊 Análise CFO:**\n\n**Situação Atual:** ${situation}\n\n**Risco / Oportunidade:** ${risk}\n\n**Ação Recomendada:** ${action}\n\n**Prazo Sugerido:** ${deadline}`
}

export default function Maxxxi() {
  const { profile, user } = useAuth()
  const { empresas, tarefas, fmt, generateAlerts, generateAlertsV5, getKpis, arquivos, getResumoFinanceiro, lancamentos, getCashFlow, getDRE, getPipeline } = useData()
  const navigate = useNavigate()
  const [showEmpSelect, setShowEmpSelect] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou o MAXXXI — seu agente executivo com IA. Posso analisar empresas, classificar despesas, gerar relatórios e muito mais. O que precisa?' }
  ])
  const [loading, setLoading] = useState(false)
  const [serverApi, setServerApi] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const msgsRef = useRef(null)

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(d => setServerApi(d.api_configured)).catch(() => setServerApi(false))
  }, [])

  function scrollBottom() { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }
  useEffect(scrollBottom, [messages])

  function buildSystemPrompt() {
    const pending = tarefas.filter(t => t.status !== 'done')
    const taskList = pending.slice(0, 12).map(t => {
      const e = empresas.find(x => x.id === t.empresa_id)
      return `- [${e?.sigla}] ${t.titulo} (${t.prioridade})`
    }).join('\n')

    const lancamentos = (() => {
      try { return JSON.parse(localStorage.getItem('orion_lancamentos_v4') || '[]') } catch { return [] }
    })()
    const mesAtual = new Date().toISOString().slice(0, 7)
    const lancMes = lancamentos.filter(l => l.mes === mesAtual && l.status === 'aprovado')
    const totalReceitas = lancMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const totalDespesas = lancMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
    const docContext = getArquivosContext(arquivos)

    const allAlerts = generateAlertsV5 ? generateAlertsV5() : generateAlerts()

    return `Você é MAXXXI — CFO Virtual e Agente Executivo IA da plataforma ORION de ${profile?.name || 'Maxwell'}.
Seu papel principal é ser o CFO virtual de Maxwell Oliveira Machado.
Tome iniciativa — identifique riscos, oportunidades e anomalias proativamente.
Estruture suas respostas: Situação Atual → Risco/Oportunidade → Ação Recomendada → Prazo.

EMPRESAS DO ECOSSISTEMA:
${empresas.map(e => `- ${e.nome} (${e.sigla}): score ${e.score}, faturamento ${fmt(e.faturamento)}, crescimento ${e.crescimento}%`).join('\n')}

TAREFAS PENDENTES (${pending.length} total):
${taskList}

ALERTAS ATIVOS: ${allAlerts.map(a => a.text).join('; ') || 'Nenhum'}

FINANCEIRO (mês atual ${mesAtual}): ${lancMes.length} lançamentos aprovados
  Receitas: ${fmt(totalReceitas)} | Despesas: ${fmt(totalDespesas)} | Resultado: ${fmt(totalReceitas - totalDespesas)}
${docContext}

CAPACIDADES:
- CFO Virtual: análise financeira estruturada, DRE, fluxo de caixa, pipeline
- Briefing diário executivo
- Analisar empresas e gerar briefings executivos
- Classificar despesas automaticamente (diga "classificar: descrição da despesa")
- Gerar relatórios por linguagem natural
- Dar prioridades, alertas e recomendações proativas
- Registrar todas as ações no log do MAXXXI

Responda em português brasileiro. Seja direto, executivo e pragmático. Máximo 3-4 parágrafos salvo pedido específico.`
  }

  function generateRelatorioEmpresa(empresaId) {
    const emp = empresas.find(e => e.id === empresaId)
    if (!emp) return 'Empresa não encontrada.'
    try {
      const resumo = getResumoFinanceiro(empresaId)
      return `**Resumo Financeiro — ${emp.nome}**\n\n` +
        `Receitas: ${fmt(resumo.receitas)}\n` +
        `Despesas: ${fmt(resumo.despesas)}\n` +
        `Resultado: ${fmt(resumo.resultado)}\n` +
        `Margem: ${resumo.margem}%\n\n` +
        `Score: ${emp.score}/100 · Faturamento: ${fmt(emp.faturamento)} · Crescimento: ${emp.crescimento}%`
    } catch { return `Dados para ${emp.nome}: Score ${emp.score}, Faturamento ${fmt(emp.faturamento)}` }
  }

  function getLocalResponse(txt) {
    const lower = txt.toLowerCase()
    const hora = new Date().getHours()
    const allAlerts = generateAlertsV5 ? generateAlertsV5() : generateAlerts()

    // Classificação de despesa
    if (lower.startsWith('classificar:') || (lower.includes('classific') && lower.includes('despesa'))) {
      const desc = txt.replace(/classificar:/i, '').trim()
      const result = autoClassify(desc)
      if (result) {
        return `🏷 **Classificação automática:** "${desc}"\n→ **${result.categoria}** / ${result.subcategoria}\n\nBaseado nos padrões ORION. Confirme no Arquivo Digital.`
      }
      return `🏷 **"${desc}"** — Classificação: **Outros / Despesas Diversas**\n\nNão encontrei padrão específico. Acesse o Arquivo Digital para classificar manualmente.`
    }

    // Briefing diário
    if (lower.includes('briefing') || lower.includes('dia') || (hora < 10 && (lower.includes('oi') || lower.includes('olá')))) {
      return generateDailyBriefing(empresas, allAlerts, tarefas)
    }

    // Fluxo de caixa
    if (getCashFlow && (lower.includes('fluxo') || lower.includes('caixa') || lower.includes('projeção'))) {
      const empEncontrado = empresas.find(e => lower.includes(e.nome.toLowerCase()) || lower.includes(e.sigla.toLowerCase()))
      const empId = empEncontrado?.id || 'dw'
      const cf = getCashFlow(empId, 30)
      const empNome = empresas.find(e => e.id === empId)?.nome || 'Doctor Wealth'
      return buildCFOResponse(
        `Saldo projetado para ${empNome} nos próximos 30 dias: ${fmt(cf.semanas[cf.semanas.length - 1]?.saldo || 0)}`,
        cf.alertaNegativo ? '⚠️ Risco de saldo NEGATIVO detectado!' : 'Fluxo de caixa positivo projetado.',
        cf.alertaNegativo ? 'Revisar despesas e antecipar receitas imediatamente.' : 'Manter ritmo atual de receita e controle de despesas.',
        cf.alertaNegativo ? 'Esta semana' : 'Monitoramento mensal'
      )
    }

    // DRE
    if (getDRE && (lower.includes('dre') || lower.includes('resultado') || (lower.includes('margem') && lower.includes('empresa')))) {
      const empEncontrado = empresas.find(e => lower.includes(e.nome.toLowerCase()) || lower.includes(e.sigla.toLowerCase()))
      const empId = empEncontrado?.id || null
      const dre = getDRE(empId, new Date().toISOString().slice(0, 7))
      const empNome = empId ? empresas.find(e => e.id === empId)?.nome : 'Ecossistema'
      return `📊 **DRE — ${empNome}:**\n\n` +
        `Receita Bruta: ${fmt(dre.receitaBruta)}\n` +
        `(-) Impostos: ${fmt(dre.deducoes)}\n` +
        `(=) Receita Líquida: ${fmt(dre.receitaLiquida)}\n` +
        `(-) Pessoal: ${fmt(dre.custosDirectos)}\n` +
        `(=) Margem Bruta: ${fmt(dre.margemBruta)} (${dre.margemBrutaPct}%)\n` +
        `(-) Despesas Op.: ${fmt(dre.despesasOp)}\n` +
        `(=) EBITDA: ${fmt(dre.ebitda)}\n` +
        `(=) **Resultado Líquido: ${fmt(dre.resultadoLiquido)} (${dre.margemLiquidaPct}%)**`
    }

    // Pipeline
    if (getPipeline && (lower.includes('pipeline') || lower.includes('receita futura') || lower.includes('funil'))) {
      const empEncontrado = empresas.find(e => lower.includes(e.nome.toLowerCase()) || lower.includes(e.sigla.toLowerCase()))
      const empId = empEncontrado?.id || 'dw'
      const p = getPipeline(empId)
      const empNome = empresas.find(e => e.id === empId)?.nome || 'Doctor Wealth'
      return `🎯 **Pipeline — ${empNome}:**\n\n` +
        `✅ Garantida (contratos): ${fmt(p.garantida)}\n` +
        `🟡 Provável (em negociação, 70%): ${fmt(p.provavel)}\n` +
        `🔵 Possível (em proposta, 40%): ${fmt(p.possivel)}\n` +
        `**Total Pipeline: ${fmt(p.total)}**`
    }

    // Relatório financeiro por empresa
    if (lower.includes('relatório') || lower.includes('resumo') || lower.includes('quanto')) {
      for (const emp of empresas) {
        if (lower.includes(emp.nome.toLowerCase()) || lower.includes(emp.sigla.toLowerCase())) {
          return generateRelatorioEmpresa(emp.id)
        }
      }
    }

    if (lower.includes('prioridade') || lower.includes('atenção') || lower.includes('critico'))
      return `**Prioridades do ecossistema:**\n\n• Original Fotografia: inadimplência em 8,7% — requer ação imediata\n• Forme Seguro: meta mensal apenas 30% atingida — acelerar captação\n• CDL ITAPERUNA e Doctor Wealth estão saudáveis (scores 88 e 80)\n\n**Recomendação:** Foque hoje em OF e FS.`

    if (lower.includes('ecossistema'))
      return `**Briefing Executivo ORION — ${new Date().toLocaleDateString('pt-BR')}**\n\nFaturamento consolidado: ${fmt(empresas.reduce((s, e) => s + e.faturamento, 0))}\nHealth Score médio: ${Math.round(empresas.reduce((s, e) => s + e.score, 0) / empresas.length)}/100\n\nDestaques: CDL ITAPERUNA lidera em score (88). Forme Seguro tem maior crescimento (+50%). OF precisa de turnaround urgente.`

    if (lower.includes('tarefa') || lower.includes('pendente'))
      return `**Status de Tarefas:**\n\n${tarefas.length} tarefas cadastradas\n${tarefas.filter(t => t.status !== 'done').length} pendentes\n${tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'done').length} de alta prioridade\n\nTop urgência: ${tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'done').slice(0, 3).map(t => t.titulo).join(', ')}`

    if (lower.includes('financeiro') || lower.includes('gasto') || lower.includes('despesa'))
      return `Para relatórios financeiros detalhados, acesse o módulo **Financeiro** na sidebar. Posso classificar despesas automaticamente: diga "classificar: [descrição da despesa]"\n\nOu experimente: "DRE Doctor Wealth", "Fluxo de caixa FS", "Pipeline DW"`

    if (lower.includes('original fotografia') || lower.includes(' of ') || lower.includes('fotografia'))
      return `**Original Fotografia:** Score 52/100, em turnaround.\n\nInadimplência 8,7% (crítico), crescimento -4,2%. Recomendo: revisar carteira de clientes inadimplentes, definir nicho (corporativo ou social) e reestruturar precificação.`

    if (lower.includes('forme seguro') || lower.includes(' fs ') || lower.includes('formatura'))
      return `**Forme Seguro:** Score 65/100, em crescimento acelerado (+50%).\n\nCapital gerenciado: R$ 420k, 3 turmas ativas. Pipeline: 5 turmas. Ação prioritária: fechar UNIFENAS Medicina 2026 e contratar comercial dedicado.`

    if (lower.includes('doctor wealth') || lower.includes(' dw '))
      return `**Doctor Wealth:** Score 80/100, crescendo 18,4%.\n\n47 clientes médicos, recorrência R$ 38k/mês. Inadimplência controlada (3,2%). Próximo objetivo: atingir 60 clientes e lançar DW Academy.`

    return 'Configure a API Claude no Vercel para respostas avançadas. Posso ajudar com: briefing do dia, fluxo de caixa, DRE, pipeline, prioridades, classificar despesas, análise por empresa.'
  }

  async function send(overrideTxt) {
    const txt = (overrideTxt || input).trim()
    if (!txt || loading) return
    setInput('')
    setShowEmpSelect(false)
    const newMsgs = [...messages, { role: 'user', content: txt }]
    setMessages(newMsgs)

    // Sempre loga
    logMaxxxiAction(user?.id, profile?.name, txt, serverApi ? 'server' : 'local', null)

    if (!serverApi) {
      setLoading(true)
      setTimeout(() => {
        const reply = getLocalResponse(txt)
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        setLoading(false)
      }, 600)
      return
    }

    setLoading(true)
    try {
      const apiMessages = newMsgs.filter(m => m.role === 'user' || m.role === 'assistant').slice(1).slice(-14)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: buildSystemPrompt(), messages: apiMessages })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Sem resposta.'
      const tokens = data.usage?.output_tokens || null
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      logMaxxxiAction(user?.id, profile?.name, txt, 'server', tokens)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão: ' + e.message }])
      logMaxxxiAction(user?.id, profile?.name, txt, 'error', null)
    }
    setLoading(false)
  }

  const quickActions = [
    '📋 Briefing do Dia',
    '💰 Fluxo de Caixa DW',
    '📊 DRE Doctor Wealth',
    '🎯 Pipeline DW',
    'Qual empresa precisa de atenção?',
    'Classificar: aluguel escritório',
  ]

  function handleResumoFinanceiro() {
    setShowEmpSelect(true)
  }

  function formatMsg(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•\s/g, '&bull; ')
  }

  return (
    <div className="mx-panel">
      {open && (
        <div className="mx-chat">
          <div className="mx-hdr">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div>
                <div className="mx-hname">🤖 MAXXXI</div>
                <div className="mx-hsub">INTELIGÊNCIA EXECUTIVA ORION</div>
              </div>
              <span className={`mx-api-status ${serverApi ? 'ok' : 'off'}`}>
                {serverApi ? 'API' : serverApi === false ? 'LOCAL' : '...'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setShowLog(!showLog)} style={{ background: 'none', border: '1px solid var(--br)', color: 'var(--tx3)', fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>
                Log
              </button>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
          </div>

          {showLog ? (
            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 10 }}>Histórico de Interações</div>
              {(() => {
                const log = JSON.parse(localStorage.getItem('orion_maxxxi_log') || '[]')
                if (log.length === 0) return <div style={{ color: 'var(--tx3)', fontSize: 12 }}>Nenhuma interação registrada.</div>
                return log.slice(0, 30).map((l, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--br)', fontSize: 12 }}>
                    <div style={{ color: 'var(--tx3)', fontSize: 10 }}>{new Date(l.timestamp).toLocaleString('pt-BR')} · {l.mode}</div>
                    <div style={{ color: 'var(--tx2)', marginTop: 2 }}>{l.message}</div>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <>
              <div className="mx-msgs" ref={msgsRef}>
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'assistant' ? 'msg-ai' : 'msg-u'}>
                    {m.role === 'assistant' && <div className="msg-from">MAXXXI</div>}
                    <div
                      className={m.role === 'assistant' ? 'msg-bubble-ai' : 'msg-bubble-u'}
                      dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="msg-ai">
                    <div className="msg-from">MAXXXI</div>
                    <div className="msg-bubble-ai">
                      <div className="mx-typing"><span></span><span></span><span></span></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mx-quick">
                {quickActions.map(q => (
                  <button key={q} className="qbtn" onClick={() => { setInput(q); setTimeout(() => send(q), 50) }}>{q}</button>
                ))}
                <button className="qbtn" onClick={handleResumoFinanceiro}>📊 Resumo Financeiro</button>
              </div>

              {showEmpSelect && (
                <div style={{ padding:'6px 14px 0', display:'flex', flexWrap:'wrap', gap:6 }}>
                  <div style={{ width:'100%', fontSize:11, color:'var(--tx3)', marginBottom:4 }}>Qual empresa?</div>
                  {empresas.map(emp => (
                    <button key={emp.id} className="qbtn"
                      style={{ borderColor: emp.cor + '55', color: emp.cor }}
                      onClick={() => { send(`Relatório financeiro da empresa ${emp.nome}`); setShowEmpSelect(false) }}>
                      {emp.sigla}
                    </button>
                  ))}
                </div>
              )}

              <div className="mx-input">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Consulte o MAXXXI... (classificar: despesa | relatório DW | briefing)"
                />
                <button className="mx-send" onClick={() => send()}>→</button>
              </div>
            </>
          )}
        </div>
      )}

      <button className="maxxxi-fab" onClick={() => setOpen(!open)} title="MAXXXI — Agente IA">
        🤖
      </button>
    </div>
  )
}
