/**
 * ImpactItem — item da seção "Impactos Esperados" (sidebar).
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   ImpactItem({ icon, texto, nivel }) → string
 */
export default function ImpactItem(props = {}){
  return `<div class="v3-impacto v3-impacto--stub" data-stub="impact-item">${props.texto || 'Impacto'}</div>`;
}
