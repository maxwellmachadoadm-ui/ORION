/**
 * OrionHero — hero "ORION Recomenda Hoje" (full-width).
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   OrionHero({ recomendacao, badge, empresa, acao, impacto, oport }) → string
 */
export default function OrionHero(props = {}){
  return `<div class="orion-hero orion-hero--stub" data-stub="orion-hero">${props.title || 'ORION Recomenda'}</div>`;
}
