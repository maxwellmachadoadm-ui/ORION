/**
 * ORION — utils compartilhados
 * Ciclo 13A — esqueleto enxuto, foco em formatação e saudação.
 */

const _brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const _brl2 = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:2, maximumFractionDigits:2 });

export function fmtBRL(value, decimals = 0){
  const n = Number(value) || 0;
  return decimals === 2 ? _brl2.format(n) : _brl.format(n);
}

/**
 * Formato compacto: 1.2k, 43k, 1.5M, 2.3B — preservando "R$".
 * Usado em KPI cards onde espaço é estreito.
 */
export function fmtShortBRL(value){
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if(abs >= 1e9) return `${sign}R$ ${(abs/1e9).toFixed(1).replace(/\.0$/,'')}B`;
  if(abs >= 1e6) return `${sign}R$ ${(abs/1e6).toFixed(1).replace(/\.0$/,'')}M`;
  if(abs >= 1e3) return `${sign}R$ ${(abs/1e3).toFixed(0)}k`;
  return _brl.format(n);
}

export function fmtPct(value, decimals = 1){
  const n = Number(value) || 0;
  return n.toFixed(decimals).replace(/\.0$/,'') + '%';
}

export function fmtNumber(value){
  const n = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR').format(Math.round(n));
}

/**
 * Saudação por hora (pt-BR). Aceita nome opcional.
 *   greeting('Maxwell') → 'BOA TARDE, MAXWELL'
 */
export function greeting(name = ''){
  const h = new Date().getHours();
  const sd = h < 6 ? 'BOA NOITE' : h < 12 ? 'BOM DIA' : h < 18 ? 'BOA TARDE' : 'BOA NOITE';
  if(!name) return sd;
  const first = String(name).trim().split(/\s+/)[0] || '';
  return `${sd}, ${first.toUpperCase()}`;
}

/**
 * Data por extenso pt-BR (ex: 'quarta-feira, 23 de abril de 2026').
 */
export function todayPtBR(date = new Date()){
  return date.toLocaleDateString('pt-BR', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });
}

/**
 * Escape básico para uso em template strings.
 */
export function escHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
