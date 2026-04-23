/* Ciclo 13B — Home v4 render real */
import { escHtml, fmtShortBRL, fmtPct } from '../../shared/utils.js';

/**
 * KpiCard — card de KPI com sparkline lateral e delta.
 * Props: { label, value, format='brl'|'pct'|'score'|'number', delta, deltaLabel, trend, tone }
 */
function formatValue(value, format){
  const n = Number(value) || 0;
  if(format === 'pct')    return fmtPct(n);
  if(format === 'score')  return String(Math.round(n));
  if(format === 'number') return String(Math.round(n));
  return fmtShortBRL(n);
}

function sparkSvg(trend, tone){
  if(!Array.isArray(trend) || trend.length < 2) return '';
  const min = Math.min(...trend), max = Math.max(...trend);
  const range = max - min || 1;
  const w = 100, h = 30, pad = 2;
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="kpi-v4__spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${points}" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export default function KpiCard(opts = {}){
  const { label = '', value = 0, format = 'brl', delta = 0, deltaLabel, trend = [], tone = 'primary' } = opts;
  const valueTxt = formatValue(value, format);
  const deltaN = Number(delta) || 0;
  const arrow = deltaN >= 0 ? '↑' : '↓';
  const deltaCls = deltaN >= 0 ? 'up' : 'down';
  const deltaTxt = deltaLabel || `${Math.abs(deltaN).toFixed(1)}% vs mês ant.`;
  return `<div class="kpi-v4 kpi-v4--${escHtml(tone)}">
    <div class="kpi-v4__label">${escHtml(label)}</div>
    <div class="kpi-v4__row">
      <div class="kpi-v4__value">${escHtml(valueTxt)}</div>
      ${sparkSvg(trend, tone)}
    </div>
    <div class="kpi-v4__delta kpi-v4__delta--${deltaCls}">
      <span class="kpi-v4__arrow">${arrow}</span>
      <span>${escHtml(deltaTxt)}</span>
    </div>
  </div>`;
}
