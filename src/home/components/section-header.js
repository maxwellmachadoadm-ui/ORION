/* Ciclo 13B — Home v4 render real */
import { escHtml } from '../../shared/utils.js';

/**
 * SectionHeader(num, label) — cabeçalho numerado de seção.
 */
export default function SectionHeader(num, label){
  return `<div class="sec-v4">
    <span class="sec-v4__num">${escHtml(num)}</span>
    <span class="sec-v4__lbl">${escHtml(label)}</span>
  </div>`;
}
