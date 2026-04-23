/**
 * KpiCard — card de KPI com label, valor, sparkline lateral e delta.
 * Stub Ciclo 13A. Implementação real em 13B.
 *
 * Contrato esperado (13B):
 *   KpiCard({ label, value, format, delta, deltaLabel, trend, tone }) → HTMLElement | string
 */
export default function KpiCard(props = {}){
  return `<div class="kpi-card-v4 kpi-card-v4--stub" data-stub="kpi-card">${props.label || 'KPI'}</div>`;
}
