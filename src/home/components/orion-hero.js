/* Ciclo 13B — Home v4 render real */
import { escHtml, fmtShortBRL } from '../../shared/utils.js';

/**
 * OrionHero — hero "ORION Recomenda Hoje" full-width.
 * Props: { titulo, descricao, empresa, acao, prioridade, impacto, acaoLink }
 */
export default function OrionHero(props = {}){
  const {
    titulo = 'Sem recomendações ativas',
    descricao = '',
    empresa = '',
    acao = '',
    prioridade = 'media',
    impacto = 0,
    acaoLink = '#'
  } = props;
  const prio = String(prioridade).toLowerCase();
  const prioMap = { critico:'Crítico', alto:'Alto', media:'Médio', baixa:'Baixo' };
  const prioLabel = prioMap[prio] || 'Médio';
  const impactoTxt = impacto > 0 ? `+${fmtShortBRL(impacto)}/mês` : '';
  return `<section class="hero-v4 hero-v4--${escHtml(prio)}">
    <header class="hero-v4__head">
      <span class="hero-v4__badge hero-v4__badge--${escHtml(prio)}">Prioridade ${escHtml(prioLabel)}</span>
      ${empresa ? `<span class="hero-v4__emp">${escHtml(empresa)}</span>` : ''}
    </header>
    <h2 class="hero-v4__title">${escHtml(titulo)}</h2>
    ${descricao ? `<p class="hero-v4__desc">${escHtml(descricao)}</p>` : ''}
    ${acao ? `<div class="hero-v4__acao">
      <span class="hero-v4__acao-lbl">Ação sugerida</span>
      <p class="hero-v4__acao-txt">${escHtml(acao)}</p>
    </div>` : ''}
    <footer class="hero-v4__foot">
      ${impactoTxt ? `<span class="hero-v4__impact">${escHtml(impactoTxt)}</span>` : '<span></span>'}
      <a href="${escHtml(acaoLink)}" class="hero-v4__cta">Ver plano completo →</a>
    </footer>
  </section>`;
}
