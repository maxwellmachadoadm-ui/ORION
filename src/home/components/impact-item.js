/* Ciclo 13B — Home v4 render real */
import { escHtml } from '../../shared/utils.js';

/**
 * ImpactItem — item da seção "Impactos Esperados" (sidebar).
 * Props: { icon, texto, nivel }  nivel ∈ {alto,medio,baixo}
 */
export default function ImpactItem(i = {}){
  const nivel = String(i.nivel || 'medio').toLowerCase();
  const nivelLabel = nivel.charAt(0).toUpperCase() + nivel.slice(1);
  return `<div class="impact-v4">
    <span class="impact-v4__ico">${escHtml(i.icon || '✨')}</span>
    <span class="impact-v4__txt">${escHtml(i.texto || '')}</span>
    <span class="impact-v4__nivel impact-v4__nivel--${escHtml(nivel)}">${escHtml(nivelLabel)}</span>
  </div>`;
}
