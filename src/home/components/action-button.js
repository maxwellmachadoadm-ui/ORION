/**
 * ActionButton — botão de ação rápida (grid 6 cols).
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   ActionButton({ icon, label, sub, onClickName }) → string
 */
export default function ActionButton(props = {}){
  return `<button class="qa-btn qa-btn--stub" data-stub="action-button">${props.label || 'Ação'}</button>`;
}
