/* Ciclo 13B — Home v4 render real */
import { escHtml, fmtShortBRL } from '../../shared/utils.js';

/**
 * PortfolioRow — linha de empresa.
 * Props: { id, nome, sigla, tipo, faturamento, crescimento, score, statusTone, statusLabel }
 */
export default function PortfolioRow(p = {}){
  const cresc = Number(p.crescimento) || 0;
  const crescStr = (cresc >= 0 ? '+' : '') + cresc.toFixed(1) + '%';
  const tone = p.statusTone || 'crescimento';
  return `<a class="pf-v4 pf-v4--${escHtml(tone)}" href="${escHtml(p.id ? '/?emp=' + p.id : '#')}">
    <div class="pf-v4__main">
      <div class="pf-v4__nome">${escHtml(p.nome || '')}</div>
      <div class="pf-v4__tipo">${escHtml(p.tipo || '')}</div>
    </div>
    <div class="pf-v4__metric">
      <div class="pf-v4__lbl">Faturamento</div>
      <div class="pf-v4__val">${escHtml(fmtShortBRL(p.faturamento || 0))}</div>
    </div>
    <div class="pf-v4__metric">
      <div class="pf-v4__lbl">Crescimento</div>
      <div class="pf-v4__val pf-v4__val--${cresc >= 0 ? 'up' : 'down'}">${escHtml(crescStr)}</div>
    </div>
    <span class="pf-v4__badge pf-v4__badge--${escHtml(tone)}">${escHtml(p.statusLabel || '')}</span>
  </a>`;
}
