/**
 * AlertPill — pill de alerta com severidade (critico/alto/atencao).
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   AlertPill({ titulo, severidade, empresa }) → string
 */
export default function AlertPill(props = {}){
  return `<span class="alert-pill alert-pill--stub" data-stub="alert-pill">${props.titulo || 'Alerta'}</span>`;
}
