// PDFExport — exportação executiva com jsPDF via CDN dinâmico
import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

const SECTIONS = [
  { id: 'kpis', label: '📊 KPIs do Ecossistema', desc: 'Faturamento, resultado, health scores' },
  { id: 'empresas', label: '🏢 Portfólio de Empresas', desc: 'Cards com status de cada empresa' },
  { id: 'alertas', label: '🔴 Alertas Ativos', desc: 'Todos os alertas críticos e de atenção' },
  { id: 'tarefas', label: '☑ Tarefas Pendentes', desc: 'Lista de tarefas por prioridade' },
  { id: 'okrs', label: '🎯 OKRs', desc: 'Objetivos e progresso de cada empresa' },
  { id: 'contratos', label: '📄 Contratos', desc: 'Contratos ativos e inadimplentes' },
  { id: 'riscos', label: '⚠ Riscos', desc: 'Mapeamento de riscos por empresa' },
  { id: 'decisoes', label: '⚡ Decisões Estratégicas', desc: 'Registro de decisões recentes' },
]

async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => resolve(window.jspdf.jsPDF)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function PDFExportButton() {
  const { empresas, tarefas, kpis, okrs, contratos, riscos, decisoes, fmt, generateAlerts } = useData()
  const { profile, logAction } = useAuth()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(['kpis', 'empresas', 'alertas', 'tarefas'])
  const [generating, setGenerating] = useState(false)

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function generatePDF() {
    setGenerating(true)
    try {
      const JsPDF = await loadJsPDF()
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W = 210
      const MARGIN = 16
      let y = 0

      // Cores
      const DARK = [15, 23, 42]
      const BLUE = [59, 130, 246]
      const GREEN = [16, 185, 129]
      const RED = [239, 68, 68]
      const AMBER = [245, 158, 11]
      const GRAY = [100, 116, 139]
      const LIGHT = [241, 245, 249]

      function newPage() {
        doc.addPage()
        y = 20
        // Header faixa
        doc.setFillColor(...DARK)
        doc.rect(0, 0, W, 12, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('ORION — Plataforma de Gestão Executiva', MARGIN, 8)
        doc.text(`${new Date().toLocaleDateString('pt-BR')}`, W - MARGIN, 8, { align: 'right' })
        y = 20
      }

      function checkSpace(needed) {
        if (y + needed > 275) newPage()
      }

      function sectionTitle(text) {
        checkSpace(14)
        doc.setFillColor(...BLUE)
        doc.rect(MARGIN, y, W - MARGIN * 2, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(text.replace(/[^\x00-\x7F]/g, (c) => c), MARGIN + 3, y + 5.5)
        y += 12
        doc.setTextColor(...DARK)
        doc.setFont('helvetica', 'normal')
      }

      function rowLabel(label, value, color) {
        checkSpace(8)
        doc.setFillColor(245, 247, 250)
        doc.rect(MARGIN, y, W - MARGIN * 2, 7, 'F')
        doc.setTextColor(...GRAY)
        doc.setFontSize(8)
        doc.text(label, MARGIN + 3, y + 4.5)
        doc.setTextColor(...(color || DARK))
        doc.setFont('helvetica', 'bold')
        doc.text(String(value), W - MARGIN - 3, y + 4.5, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        y += 8
      }

      // ── CAPA ──
      doc.setFillColor(...DARK)
      doc.rect(0, 0, W, 297, 'F')

      // Título
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(32)
      doc.setFont('helvetica', 'bold')
      doc.text('ORION', W / 2, 80, { align: 'center' })

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Relatorio Executivo', W / 2, 93, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, W / 2, 103, { align: 'center' })
      doc.text(`Por: ${profile?.name || 'Usuario'}`, W / 2, 111, { align: 'center' })

      // Linha separadora
      doc.setDrawColor(...BLUE)
      doc.setLineWidth(0.5)
      doc.line(MARGIN * 3, 120, W - MARGIN * 3, 120)

      // Seções incluídas
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text('Secoes incluidas:', W / 2, 132, { align: 'center' })
      const secNames = selected.map(s => SECTIONS.find(x => x.id === s)?.label.replace(/[^\x00-\x7F]/g, '') || s)
      secNames.forEach((s, i) => {
        doc.text(`• ${s}`, W / 2, 142 + i * 8, { align: 'center' })
      })

      newPage()

      // ── KPIs ──
      if (selected.includes('kpis')) {
        sectionTitle('KPIs DO ECOSSISTEMA')
        const empsAtivas = empresas.filter(e => e.id !== 'gp')
        rowLabel('Faturamento Total', fmt(empsAtivas.reduce((s, e) => s + e.faturamento, 0)), GREEN)
        rowLabel('Resultado Liquido', fmt(empsAtivas.reduce((s, e) => s + e.resultado, 0)), GREEN)
        rowLabel('Health Score Medio', `${Math.round(empresas.reduce((s, e) => s + e.score, 0) / empresas.length)}/100`, BLUE)
        rowLabel('Alertas Ativos', generateAlerts().length, RED)
        rowLabel('Tarefas Pendentes', tarefas.filter(t => t.status !== 'done').length, AMBER)
        y += 6
      }

      // ── EMPRESAS ──
      if (selected.includes('empresas')) {
        sectionTitle('PORTFOLIO DE EMPRESAS')
        empresas.filter(e => e.id !== 'gp').forEach(e => {
          checkSpace(30)
          doc.setFillColor(30, 41, 59)
          doc.rect(MARGIN, y, W - MARGIN * 2, 28, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(e.nome, MARGIN + 4, y + 7)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...GRAY)
          doc.text(e.descricao, MARGIN + 4, y + 13)
          doc.setTextColor(...GREEN)
          doc.text(`Fat: ${fmt(e.faturamento)}`, MARGIN + 4, y + 20)
          doc.setTextColor(...BLUE)
          doc.text(`Score: ${e.score}/100`, MARGIN + 60, y + 20)
          doc.setTextColor(...(e.crescimento >= 0 ? GREEN : RED))
          doc.text(`Crescimento: ${e.crescimento > 0 ? '+' : ''}${e.crescimento}%`, MARGIN + 100, y + 20)
          y += 32
        })
        y += 4
      }

      // ── ALERTAS ──
      if (selected.includes('alertas')) {
        const alerts = generateAlerts()
        sectionTitle(`ALERTAS ATIVOS (${alerts.length})`)
        if (alerts.length === 0) {
          doc.setTextColor(...GREEN)
          doc.setFontSize(9)
          doc.text('Nenhum alerta ativo — ecossistema saudavel', MARGIN, y)
          y += 8
        } else {
          alerts.forEach(a => {
            checkSpace(10)
            doc.setFillColor(...(a.level === 'critico' ? [239, 68, 68] : [245, 158, 11]))
            doc.circle(MARGIN + 2, y + 3.5, 2, 'F')
            doc.setTextColor(...DARK)
            doc.setFontSize(8)
            doc.text(a.text, MARGIN + 7, y + 4.5, { maxWidth: W - MARGIN * 2 - 12 })
            y += 9
          })
        }
        y += 4
      }

      // ── TAREFAS ──
      if (selected.includes('tarefas')) {
        const pending = tarefas.filter(t => t.status !== 'done').sort((a, b) => {
          const pri = { alta: 0, media: 1, baixa: 2 }
          return (pri[a.prioridade] || 1) - (pri[b.prioridade] || 1)
        })
        sectionTitle(`TAREFAS PENDENTES (${pending.length})`)
        pending.forEach(t => {
          checkSpace(8)
          const color = t.prioridade === 'alta' ? RED : t.prioridade === 'media' ? AMBER : GRAY
          doc.setFillColor(...color)
          doc.rect(MARGIN, y + 1.5, 3, 5, 'F')
          doc.setTextColor(...DARK)
          doc.setFontSize(8)
          doc.text(t.titulo, MARGIN + 6, y + 5.5, { maxWidth: W - MARGIN * 2 - 40 })
          doc.setTextColor(...GRAY)
          const e = empresas.find(x => x.id === t.empresa_id)
          doc.text(e?.sigla || '', W - MARGIN - 3, y + 5.5, { align: 'right' })
          y += 8
        })
        y += 4
      }

      // ── OKRs ──
      if (selected.includes('okrs')) {
        sectionTitle('OKRs — OBJETIVOS E PROGRESSO')
        okrs.forEach(o => {
          checkSpace(10)
          const e = empresas.find(x => x.id === o.empresa_id)
          doc.setTextColor(...GRAY)
          doc.setFontSize(7)
          doc.text(e?.sigla || '', MARGIN, y + 4)
          doc.setTextColor(...DARK)
          doc.setFontSize(8)
          doc.text(o.objetivo, MARGIN + 10, y + 4, { maxWidth: W - MARGIN * 2 - 40 })
          // Barra de progresso
          doc.setFillColor(30, 41, 59)
          doc.rect(W - MARGIN - 55, y, 50, 6, 'F')
          const pColor = o.progresso >= 70 ? GREEN : o.progresso >= 40 ? AMBER : RED
          doc.setFillColor(...pColor)
          doc.rect(W - MARGIN - 55, y, 50 * (o.progresso / 100), 6, 'F')
          doc.setTextColor(...pColor)
          doc.setFontSize(7)
          doc.text(`${o.progresso}%`, W - MARGIN - 2, y + 4.5, { align: 'right' })
          y += 10
        })
      }

      // Rodapé na última página
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(...DARK)
        doc.rect(0, 284, W, 13, 'F')
        doc.setTextColor(...GRAY)
        doc.setFontSize(7)
        doc.text('ORION — Plataforma de Gestao Executiva — Confidencial', MARGIN, 291)
        doc.text(`Pagina ${i} de ${totalPages}`, W - MARGIN, 291, { align: 'right' })
      }

      const filename = `ORION_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
      logAction('PDF_EXPORTADO', `Seções: ${selected.join(', ')} — ${filename}`)
    } catch (e) {
      alert('Erro ao gerar PDF: ' + e.message)
    }
    setGenerating(false)
    setOpen(false)
  }

  return (
    <>
      <button className="btn" style={{ gap: 7 }} onClick={() => setOpen(true)} title="Exportar PDF executivo">
        📄 Exportar PDF
      </button>

      {open && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal" style={{ width: 460 }}>
            <div className="modal-title">
              <span>📄 Exportar Relatório PDF</span>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 18 }}>
              Selecione os módulos a incluir no relatório executivo.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {SECTIONS.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 'var(--r2)', background: selected.includes(s.id) ? 'rgba(59,130,246,.08)' : 'var(--s2)', border: `1px solid ${selected.includes(s.id) ? 'rgba(59,130,246,.3)' : 'var(--br)'}`, cursor: 'pointer', transition: '.15s' }}>
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} style={{ marginTop: 2, accentColor: 'var(--blue)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected.includes(s.id) ? 'var(--blue3)' : 'var(--tx)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <button className="btn-primary" onClick={generatePDF} disabled={generating || selected.length === 0}>
              {generating ? 'Gerando PDF...' : `Gerar PDF (${selected.length} seções)`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
