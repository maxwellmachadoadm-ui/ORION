/**
 * ORION — Home v4 bootstrap (esqueleto Ciclo 13A)
 *
 * Por enquanto:
 *   1. Verifica auth (com fallback gracioso se Supabase não configurado).
 *   2. Escreve placeholder identificando módulo carregado.
 *   3. Importa todos os componentes stub para validar o grafo de módulos.
 *
 * Em 13B este arquivo passa a:
 *   - chamar aggregators reais lendo do Supabase,
 *   - montar as 6 seções da Home (hero + KPIs + portfolio + tarefas +
 *     lançamentos + ações) usando os componentes,
 *   - tratar refresh, loading, errors, empty states.
 */

import { getCurrentUser } from '../shared/auth.js';
import { greeting, todayPtBR, escHtml } from '../shared/utils.js';

// Importa stubs só para garantir que o grafo de módulos resolve.
import KpiCard from './components/kpi-card.js';
import AlertPill from './components/alert-pill.js';
import TaskCard from './components/task-card.js';
import PortfolioRow from './components/portfolio-row.js';
import ActionButton from './components/action-button.js';
import ImpactItem from './components/impact-item.js';
import SectionHeader from './components/section-header.js';
import OrionHero from './components/orion-hero.js';

const COMPONENTS = {
  KpiCard, AlertPill, TaskCard, PortfolioRow,
  ActionButton, ImpactItem, SectionHeader, OrionHero
};

async function bootstrap(){
  const root = document.getElementById('home-root');
  if(!root) return;

  // 13A não força redirect — só identifica usuário se existir.
  let user = null;
  try { user = await getCurrentUser(); } catch(e){ /* noop */ }

  const nome = (user && (user.name || user.email)) || 'visitante';
  const carregados = Object.keys(COMPONENTS).join(', ');

  root.innerHTML = `
    <div class="boot-placeholder">
      <h1>ORION — Home v4 (Ciclo 13A)</h1>
      <p>${escHtml(greeting(nome))}</p>
      <p>${escHtml(todayPtBR())}</p>
      <p style="margin-top:12px;font-size:11px;opacity:.6">
        módulos carregados: ${escHtml(carregados)}
      </p>
      <p style="margin-top:8px;font-size:11px;opacity:.6">
        Próxima fase (13B): aggregators + render real das 6 seções.
      </p>
    </div>`;
}

bootstrap().catch(err => {
  console.error('[home v4] bootstrap falhou', err);
});
