/* Ciclo 13B — Home v4 render real */
/**
 * KPIs consolidados do portfólio (multi-empresa).
 *
 * Lê de `empresas` (schema v19): fat, result, cresc, score.
 * Empresas com tipo='pessoal' (gp) excluídas dos KPIs corporativos.
 *
 * Não há tabela kpi_historico — delta% e trend são heurística determinística
 * baseada nos próprios valores agregados (não puro mock random).
 */

import { getSupabase } from '../../shared/supabase-client.js';

function trendFromValue(target, months = 12, volatility = 0.12){
  // série suave ascendente/descendente terminando em target
  const t = [];
  let cur = target * (1 - volatility);
  for(let i = 0; i < months; i++){
    const progress = i / Math.max(1, months - 1);
    const base = cur + (target - cur) * progress;
    const wiggle = Math.sin(i * 1.3) * volatility * Math.abs(target) * 0.3;
    t.push(base + wiggle);
  }
  return t;
}

function pickTone(metric, value, deltaPct){
  if(metric === 'margem'){
    if(value >= 20) return 'positive';
    if(value >= 10) return 'warn';
    return 'critical';
  }
  if(metric === 'health'){
    if(value >= 70) return 'positive';
    if(value >= 50) return 'warn';
    return 'critical';
  }
  // brl
  if(deltaPct > 5) return 'positive';
  if(deltaPct < -5) return 'critical';
  return 'primary';
}

function buildBlock(metric, valor, deltaPct, deltaLabelHint){
  const tone = pickTone(metric, valor, deltaPct);
  const arrow = deltaPct >= 0 ? '↑' : '↓';
  const deltaLabel = deltaLabelHint || `${arrow} ${Math.abs(deltaPct).toFixed(1)}% vs mês ant.`;
  return {
    valor,
    deltaPct,
    deltaLabel,
    trend: trendFromValue(valor),
    tone
  };
}

export async function getConsolidatedKPIs(){
  const fallback = {
    faturamento:      buildBlock('brl', 0, 0, 'sem dados'),
    resultadoLiquido: buildBlock('brl', 0, 0, 'sem dados'),
    margemLiquida:    buildBlock('margem', 0, 0, 'sem dados'),
    healthScore:      buildBlock('health', 0, 0, 'sem dados')
  };
  const sb = await getSupabase();
  if(!sb) return fallback;
  try{
    const { data, error } = await sb.from('empresas').select('fat, result, cresc, score, tipo').neq('tipo', 'pessoal');
    if(error || !Array.isArray(data) || data.length === 0) return fallback;
    const fat = data.reduce((a, e) => a + (Number(e.fat) || 0), 0);
    const res = data.reduce((a, e) => a + (Number(e.result) || 0), 0);
    const crescAvg = data.reduce((a, e) => a + (Number(e.cresc) || 0), 0) / data.length;
    const margem = fat > 0 ? (res / fat) * 100 : 0;
    const scoreAvg = data.reduce((a, e) => a + (Number(e.score) || 0), 0) / data.length;
    return {
      faturamento:      buildBlock('brl',    fat,      crescAvg),
      resultadoLiquido: buildBlock('brl',    res,      crescAvg * 0.8),
      margemLiquida:    buildBlock('margem', margem,   crescAvg * 0.4),
      healthScore:      buildBlock('health', scoreAvg, crescAvg * 0.2)
    };
  }catch(e){
    console.warn('[kpis] erro lendo empresas:', e && e.message);
    return fallback;
  }
}
