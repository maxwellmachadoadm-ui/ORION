import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

// ── Log do MAXXXI ──
function logMaxxxiAction(userId, userName, message, mode, tokens) {
  try {
    const log = JSON.parse(localStorage.getItem('orion_maxxxi_log') || '[]')
    log.unshift({ timestamp: new Date().toISOString(), user_id: userId, user_name: userName, message, mode, tokens: tokens || null })
    localStorage.setItem('orion_maxxxi_log', JSON.stringify(log.slice(0, 500)))
  } catch (_) {}
}

// ── RAG simples: lê arquivos do localStorage ──
function getDocumentContext() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('orion_files_'))
  const docs = []
  keys.forEach(key => {
    try {
      const files = JSON.parse(localStorage.getItem(key) || '[]')
      const empId = key.replace('orion_files_', '')
      files.slice(0, 5).forEach(f => {
        if (f.name && (f.name.endsWith('.txt') || f.name.endsWith('.csv'))) {
          docs.push(`[Arquivo: ${f.name} — empresa ${empId}]`)
        } else {
          docs.push(`[Arquivo: ${f.name} — ${(f.size / 1024).toFixed(1)}KB — empresa ${empId}]`)
        }
      })
    } catch (_) {}
  })
  return docs.length > 0 ? `\nArquivos carregados: ${docs.join('; ')}` : ''
}

// ── Classificação automática de despesas ──
function classifyExpense(text) {
  const lower = text.toLowerCase()
  if (lower.includes('salário') || lower.includes('folha') || lower.includes('remuneração')) return 'Folha de Pagamento'
  if (lower.includes('aluguel') || lower.includes('locação')) return 'Aluguel'
  if (lower.includes('luz') || lower.includes('energia') || lower.includes('água') || lower.includes('internet')) return 'Serviços'
  if (lower.includes('marketing') || lower.includes('publicidade') || lower.includes('anúncio')) return 'Marketing'
  if (lower.includes('imposto') || lower.includes('das') || lower.includes('inss') || lower.includes('fgts')) return 'Impostos'
  if (lower.includes('software') || lower.includes('sistema') || lower.includes('assinatura') || lower.includes('cloud')) return 'Tecnologia'
  if (lower.includes('fornecedor') || lower.includes('compra') || lower.includes('insumo')) return 'Fornecedores'
  return 'Outros'
}

export default function Maxxxi() {
  const { profile, user } = useAuth()
  const { empresas, tarefas, fmt, generateAlerts, getKpis } = useData()
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
      try { return JSON.parse(localStorage.getItem('orion_lancamentos') || '[]') } catch { return [] }
    })()
    const lancMes = lancamentos.filter(l => l.mes === new Date().getMonth() + 1)
    const totalGastos = lancMes.reduce((s, l) => s + (l.valor || 0), 0)

    const docContext = getDocumentContext()

    return `Você é MAXXXI — Agente Executivo IA da plataforma ORION de ${profile?.name || 'Maxwell'}.

EMPRESAS DO ECOSSISTEMA:
${empresas.map(e => `- ${e.nome} (${e.sigla}): score ${e.score}, faturamento ${fmt(e.faturamento)}, crescimento ${e.crescimento}%`).join('\n')}

TAREFAS PENDENTES (${pending.length} total):
${taskList}

ALERTAS ATIVOS: ${generateAlerts().map(a => a.text).join('; ') || 'Nenhum'}

FINANCEIRO (mês atual): ${lancMes.length} lançamentos, total ${fmt(totalGastos)}
${docContext}

CAPACIDADES:
- Analisar empresas e gerar briefings executivos
- Classificar despesas automaticamente (diga "classificar: descrição da despesa")
- Gerar relatórios por linguagem natural
- Dar prioridades, alertas e recomendações
- Registrar todas as ações no log do MAXXXI

Responda em português brasileiro. Seja direto, executivo e pragmático. Máximo 3-4 parágrafos salvo pedido específico.`
  }

  function getLocalResponse(txt) {
    const lower = txt.toLowerCase()

    // Classificação de despesa
    if (lower.startsWith('classificar:') || lower.includes('classific') && lower.includes('despesa')) {
      const desc = txt.replace(/classificar:/i, '').trim()
      const categoria = classifyExpense(desc)
      return `🏷 **Classificação automática:** "${desc}" → **${categoria}**\n\nBaseado nos padrões do sistema ORION. Confirme no módulo Financeiro.`
    }

    if (lower.includes('prioridade') || lower.includes('atenção') || lower.includes('critico'))
      return `**Prioridades do ecossistema:**\n\n• Original Fotografia: inadimplência em 8,7% — requer ação imediata\n• Forme Seguro: meta mensal apenas 30% atingida — acelerar captação\n• CDL ITAPERUNA e Doctor Wealth estão saudáveis (scores 88 e 80)\n\n**Recomendação:** Foque hoje em OF e FS.`

    if (lower.includes('briefing') || lower.includes('ecossistema') || lower.includes('resumo'))
      return `**Briefing Executivo ORION — ${new Date().toLocaleDateString('pt-BR')}**\n\nFaturamento consolidado: ${fmt(empresas.reduce((s, e) => s + e.faturamento, 0))}\nHealth Score médio: ${Math.round(empresas.reduce((s, e) => s + e.score, 0) / empresas.length)}/100\n\nDestaques: CDL ITAPERUNA lidera em score (88). Forme Seguro tem maior crescimento (+50%). OF precisa de turnaround urgente.`

    if (lower.includes('tarefa') || lower.includes('pendente'))
      return `**Status de Tarefas:**\n\n${tarefas.length} tarefas cadastradas\n${tarefas.filter(t => t.status !== 'done').length} pendentes\n${tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'done').length} de alta prioridade\n\nTop urgência: ${tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'done').slice(0, 3).map(t => t.titulo).join(', ')}`

    if (lower.includes('financeiro') || lower.includes('gasto') || lower.includes('despesa'))
      return `Para relatórios financeiros detalhados, acesse o módulo **Financeiro** na sidebar. Posso classificar despesas automaticamente: diga "classificar: [descrição da despesa]"`

    if (lower.includes('original fotografia') || lower.includes(' of ') || lower.includes('fotografia'))
      return `**Original Fotografia:** Score 52/100, em turnaround.\n\nInadvimplência 8,7% (crítico), crescimento -4,2%. Recomendo: revisar carteira de clientes inadimplentes, definir nicho (corporativo ou social) e reestruturar precificação.`

    if (lower.includes('forme seguro') || lower.includes(' fs ') || lower.includes('formatura'))
      return `**Forme Seguro:** Score 65/100, em crescimento acelerado (+50%).\n\nCapital gerenciado: R$ 420k, 3 turmas ativas. Pipeline: 5 turmas. Ação prioritária: fechar UNIFENAS Medicina 2026 e contratar comercial dedicado.`

    if (lower.includes('doctor wealth') || lower.includes(' dw '))
      return `**Doctor Wealth:** Score 80/100, crescendo 18,4%.\n\n47 clientes médicos, recorrência R$ 38k/mês. Inadimplência controlada (3,2%). Próximo objetivo: atingir 60 clientes e lançar DW Academy.`

    return 'Configure a API Claude no Vercel para respostas avançadas. Posso ajudar com: prioridades, briefings, tarefas, classificar despesas, análise por empresa.'
  }

  async function send() {
    if (!input.trim() || loading) return
    const txt = input.trim()
    setInput('')
    const newMsgs = [...messages, { role: 'user', content: txt }]
    setMessages(newMsgs)

    if (!serverApi) {
      setLoading(true)
      setTimeout(() => {
        const reply = getLocalResponse(txt)
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        logMaxxxiAction(user?.id, profile?.name, txt, 'local', null)
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
    'Briefing executivo',
    'Qual empresa precisa de atenção?',
    'Analise minhas tarefas',
    'Plano de ação desta semana',
    'Classificar: aluguel escritório',
  ]

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
                  <button key={q} className="qbtn" onClick={() => { setInput(q); setTimeout(send, 50) }}>{q}</button>
                ))}
              </div>

              <div className="mx-input">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Consulte o MAXXXI... (classificar: despesa | briefing | tarefas)"
                />
                <button className="mx-send" onClick={send}>→</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mx-fab" onClick={() => setOpen(!open)}>
        <div className="fi">🤖</div>
        <div className="fl">MAXXXI</div>
      </div>
    </div>
  )
}
