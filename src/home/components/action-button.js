/* Ciclo 13B — Home v4 render real */
import { escHtml } from '../../shared/utils.js';

/**
 * ActionButton — botão de ação rápida (grid 6 cols).
 * Props: { icon, label, sub, href }
 */
export default function ActionButton(b = {}){
  const href = b.href || '#';
  return `<a class="qa-v4" href="${escHtml(href)}">
    <span class="qa-v4__lbl"><span class="qa-v4__ico">${escHtml(b.icon || '•')}</span>${escHtml(b.label || '')}</span>
    ${b.sub ? `<span class="qa-v4__sub">${escHtml(b.sub)}</span>` : ''}
  </a>`;
}
