/* Ciclo 13B — Home v4 render real
 * Bootstrap da Home modular: auth → fetch paralelo de 6 aggregators → render.
 * Modo degradado (sem Supabase): banner amarelo + dados vazios.
 */

import { requireAuth } from '../shared/auth.js';
import { greeting, todayPtBR, escHtml, fmtShortBRL } from '../shared/utils.js';
import { sbConnected } from '../shared/supabase-client.js';

import { getConsolidatedKPIs }       from './aggregators/kpis.js';
import { getPortfolioEmpresas }      from './aggregators/portfolio.js';
import { getAlertasAtivos }          from './aggregators/alertas.js';
import { getTarefasPrioritarias }    from './aggregators/tarefas.js';
import { getUltimosLancamentos }     from './aggregators/lancamentos.js';
import { getOrionInsightPrioritario } from './aggregators/insight.js';

import OrionHero      from './components/orion-hero.js';
import KpiCard        from './components/kpi-card.js';
import PortfolioRow   from './components/portfolio-row.js';
import TaskCard       from './components/task-card.js';
import AlertPill      from './components/alert-pill.js';
import ActionButton   from './components/action-button.js';
import ImpactItem     from './components/impact-item.js';
import SectionHeader  from './components/section-header.js';

const ACOES_RAPIDAS = [
  { icon:'➕', label:'Novo Lançamento', sub:'Receita ou despesa', href:'/?action=novo-lancamento' },
  { icon:'📤', label:'Enviar Extrato',  sub:'PDF, Excel ou CSV',  href:'/?action=upload-extrato'  },
  { icon:'🏢', label:'Nova Empresa',    sub:'Adicionar ao portfólio', href:'/?action=nova-empresa'   },
  { icon:'📋', label:'Nova Tarefa',     sub:'Para qualquer empresa',  href:'/?action=nova-tarefa'    },
  { icon:'👁️', label:'Visão CEO',      sub:'Análise executiva',     href:'/?page=ceo'              },
  { icon:'📅', label:'Agenda',          sub:'Próximos compromissos',  href:'/?page=agenda'           }
];

const IMPACTOS_BASE = [
  { icon:'📈', texto:'Visibilidade financeira em tempo real', nivel:'alto' },
  { icon:'⚡', texto:'Decisões baseadas em dados', nivel:'alto' },
  { icon:'🎯', texto:'Foco em ações de maior impacto', nivel:'medio' },
  { icon:'🛡️', texto:'Detecção precoce de riscos', nivel:'medio' },
  { icon:'⏱️', texto:'Economia de tempo operacional', nivel:'baixo' }
];

function renderHeader(user){
  const nome = (user && (user.name || user.email)) || 'Visitante';
  return `<header class="home-v4__header">
    <div class="head-v4">
      <div>
        <div class="head-v4__greeting">${escHtml(greeting(nome))}</div>
        <h1 class="head-v4__title">Central do CEO</h1>
      </div>
      <div class="head-v4__right">
        <div class="head-v4__date">${escHtml(todayPtBR())}</div>
        <div class="head-v4__icons" aria-hidden="true"><span>🎯</span><span>🚀</span><span>⭐</span></div>
      </div>
    </div>
  </header>`;
}

function renderLoginRequiredScreen(){
  return `<div class="login-required-v4">
    <div class="login-required-v4__icon" aria-hidden="true">🔒</div>
    <h2 class="login-required-v4__title">Login necessário</h2>
    <p class="login-required-v4__desc">A Central do CEO precisa de uma sessão autenticada para carregar seus dados consolidados.</p>
    <a class="login-required-v4__cta" href="/?orionLegacyHome=1">Ir para o login →</a>
    <p class="login-required-v4__hint">Após autenticar, você será redirecionado de volta automaticamente.</p>
  </div>`;
}

function renderKpis(k){
  return `<div class="kpi-grid-v4">
    ${KpiCard({ label:'Faturamento',      value:k.faturamento.valor,      format:'brl',   delta:k.faturamento.deltaPct,      deltaLabel:k.faturamento.deltaLabel,      trend:k.faturamento.trend,      tone:k.faturamento.tone })}
    ${KpiCard({ label:'Resultado Líquido', value:k.resultadoLiquido.valor, format:'brl',   delta:k.resultadoLiquido.deltaPct, deltaLabel:k.resultadoLiquido.deltaLabel, trend:k.resultadoLiquido.trend, tone:k.resultadoLiquido.tone })}
    ${KpiCard({ label:'Margem Líquida',    value:k.margemLiquida.valor,    format:'pct',   delta:k.margemLiquida.deltaPct,    deltaLabel:k.margemLiquida.deltaLabel,    trend:k.margemLiquida.trend,    tone:k.margemLiquida.tone })}
    ${KpiCard({ label:'Health Score',      value:k.healthScore.valor,      format:'score', delta:k.healthScore.deltaPct,      deltaLabel:k.healthScore.deltaLabel,      trend:k.healthScore.trend,      tone:k.healthScore.tone })}
  </div>`;
}

function renderPortfolio(items){
  if(!items.length){
    return `<div class="empty-v4">
      Nenhuma empresa no portfólio.
      <span class="empty-v4__sub">Cadastre uma empresa para começar.</span>
      <a class="empty-v4__cta" href="/?action=nova-empresa">Cadastrar primeira empresa →</a>
    </div>`;
  }
  return `<div class="pf-list-v4">${items.map(p => PortfolioRow(p)).join('')}</div>`;
}

function renderTarefas(items){
  if(!items.length){
    return `<div class="empty-v4">
      Nenhuma tarefa prioritária no momento.
      <span class="empty-v4__sub">Operação saudável ou sem dados ainda.</span>
    </div>`;
  }
  return `<div class="task-grid-v4">${items.map(t => TaskCard(t)).join('')}</div>`;
}

function renderLancamentos(items){
  if(!items.length){
    return `<div class="empty-v4">
      Nenhum lançamento recente.
      <a class="empty-v4__cta" href="/?action=upload-extrato">Enviar extrato agora →</a>
    </div>`;
  }
  return `<div class="lanc-list-v4">${items.map(l => `
    <div class="lanc-v4">
      <div class="lanc-v4__date">${escHtml(formatDate(l.data))}</div>
      <div>
        <div class="lanc-v4__desc">${escHtml(l.descricao)}</div>
        ${l.empresaSigla ? `<div class="lanc-v4__emp">${escHtml(l.empresaSigla)}</div>` : ''}
      </div>
      <div class="lanc-v4__val lanc-v4__val--${l.type}">${escHtml((l.type === 'expense' ? '-' : '+') + fmtShortBRL(Math.abs(l.valor)))}</div>
    </div>
  `).join('')}</div>`;
}

function formatDate(d){
  if(!d) return '';
  try{
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  }catch(e){ return String(d); }
}

function renderAcoes(){
  return `<div class="qa-grid-v4">${ACOES_RAPIDAS.map(a => ActionButton(a)).join('')}</div>`;
}

function renderSection(num, label, body){
  return `<section class="section-v4">
    ${SectionHeader(num, label)}
    ${body}
  </section>`;
}

function renderAlertasCard(alertas){
  const total = alertas.total || 0;
  const itens = alertas.items || [];
  const body = itens.length
    ? itens.slice(0, 6).map(a => AlertPill(a)).join('')
    : `<div class="empty-v4">Sem alertas ativos.<span class="empty-v4__sub">Operação dentro dos padrões.</span></div>`;
  return `<div class="aside-card-v4">
    <div class="aside-card-v4__title">
      <span>Alertas Ativos</span>
      ${total > 0 ? `<span class="aside-card-v4__badge">${total}</span>` : ''}
    </div>
    ${body}
  </div>`;
}

function renderImpactosCard(){
  return `<div class="aside-card-v4">
    <div class="aside-card-v4__title"><span>Impactos Esperados</span></div>
    ${IMPACTOS_BASE.map(i => ImpactItem(i)).join('')}
  </div>`;
}

async function bootstrap(){
  const root = document.getElementById('home-root');
  if(!root) return;

  const user = await requireAuth();

  // Ciclo 13C — sem usuário e sem Supabase: tela de Login. Não renderiza dashboard vazio.
  if(!user && !sbConnected()){
    root.innerHTML = renderLoginRequiredScreen();
    return;
  }
  // Sem usuário mas Supabase OK: pode ser tela pública preview — mostra dashboard com dados se acessíveis
  // (RLS bloqueia se não autenticado; aggregators retornam [] gracefully).

  const [kpis, portfolio, alertas, tarefas, lancamentos, insight] = await Promise.all([
    getConsolidatedKPIs(),
    getPortfolioEmpresas(),
    getAlertasAtivos(),
    getTarefasPrioritarias(),
    getUltimosLancamentos(),
    getOrionInsightPrioritario()
  ]);

  // Caso degradado raro: Supabase falhou completamente. Mostra login.
  if(!sbConnected()){
    root.innerHTML = renderLoginRequiredScreen();
    return;
  }

  const html = `
    ${renderHeader(user)}
    <div class="home-v4__hero-wrap">
      ${SectionHeader('1', 'ORION Recomenda Hoje')}
      ${OrionHero(insight)}
    </div>
    <div class="home-v4__main">
      ${renderSection('2', 'KPIs Consolidados',     renderKpis(kpis))}
      ${renderSection('3', 'Portfólio de Empresas', renderPortfolio(portfolio))}
      ${renderSection('4', 'Tarefas Prioritárias',  renderTarefas(tarefas))}
      ${renderSection('5', 'Últimos Lançamentos',   renderLancamentos(lancamentos))}
      ${renderSection('6', 'Ações Rápidas',         renderAcoes())}
    </div>
    <aside class="home-v4__aside">
      ${renderAlertasCard(alertas)}
      ${renderImpactosCard()}
    </aside>
  `;
  root.innerHTML = html;
}

bootstrap().catch(err => {
  console.error('[home v4] bootstrap falhou', err);
  const root = document.getElementById('home-root');
  if(root){
    root.innerHTML = `<div class="empty-v4">
      Falha ao carregar a Home: ${escHtml(err && err.message || 'erro desconhecido')}
      <span class="empty-v4__sub">Veja o console para detalhes.</span>
    </div>`;
  }
});
