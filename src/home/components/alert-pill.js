/* Ciclo 13B — Home v4 render real */
import { escHtml } from '../../shared/utils.js';

/**
 * AlertPill — pill de alerta na sidebar (severidade colorida).
 * Props: { titulo, empresa, severidade, horario }
 */
export default function AlertPill(a = {}){
  const sev = String(a.severidade || 'atencao').toLowerCase();
  return `<div class="alert-v4 alert-v4--${escHtml(sev)}">
    <span class="alert-v4__dot alert-v4__dot--${escHtml(sev)}"></span>
    <div class="alert-v4__body">
      ${a.empresa ? `<div class="alert-v4__emp">${escHtml(a.empresa)}</div>` : ''}
      <div class="alert-v4__txt">${escHtml(a.titulo || '')}</div>
      ${a.horario ? `<div class="alert-v4__time">${escHtml(a.horario)}</div>` : ''}
    </div>
  </div>`;
}
