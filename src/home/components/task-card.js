/* Ciclo 13B — Home v4 render real */
import { escHtml } from '../../shared/utils.js';

/**
 * TaskCard — card de tarefa prioritária.
 * Props: { titulo, empresa, prioridade, impacto, origem, prazo }
 */
export default function TaskCard(t = {}){
  const prio = String(t.prioridade || 'media').toLowerCase();
  const imp = String(t.impacto || 'medio').toLowerCase();
  const prioMap = { alta:'Alta', media:'Média', baixa:'Baixa' };
  return `<div class="task-v4 task-v4--${escHtml(prio)}">
    <header class="task-v4__head">
      <span class="task-v4__prio task-v4__prio--${escHtml(prio)}">${escHtml(prioMap[prio] || 'Média')}</span>
      ${t.origem ? `<span class="task-v4__src">${escHtml(t.origem)}</span>` : ''}
    </header>
    <p class="task-v4__title">${escHtml(t.titulo || '(sem título)')}</p>
    <footer class="task-v4__foot">
      ${t.empresa ? `<span class="task-v4__emp">${escHtml(t.empresa)}</span>` : ''}
      <span class="task-v4__impact task-v4__impact--${escHtml(imp)}">Impacto ${escHtml(imp)}</span>
    </footer>
  </div>`;
}
