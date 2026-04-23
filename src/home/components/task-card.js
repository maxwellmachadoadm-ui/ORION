/**
 * TaskCard — card de tarefa prioritária.
 * Stub Ciclo 13A.
 *
 * Contrato esperado (13B):
 *   TaskCard({ titulo, empresa, prioridade, impacto, origem, prazo }) → string
 */
export default function TaskCard(props = {}){
  return `<div class="task-card task-card--stub" data-stub="task-card">${props.titulo || 'Tarefa'}</div>`;
}
