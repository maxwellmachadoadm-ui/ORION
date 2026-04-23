/**
 * PortfolioRow — linha de empresa no portfólio consolidado.
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   PortfolioRow({ id, nome, tipo, valor, healthScore, status }) → string
 */
export default function PortfolioRow(props = {}){
  return `<div class="pf-row pf-row--stub" data-stub="portfolio-row">${props.nome || 'Empresa'}</div>`;
}
