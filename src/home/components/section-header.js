/**
 * SectionHeader — cabeçalho numerado de seção (badge + label).
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   SectionHeader(num, label) → string
 */
export default function SectionHeader(num = '', label = ''){
  return `<div class="sec-hd sec-hd--stub" data-stub="section-header"><span class="sec-hd__num">${num}</span><span class="sec-hd__lbl">${label}</span></div>`;
}
