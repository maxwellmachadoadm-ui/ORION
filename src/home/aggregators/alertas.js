/* Ciclo 13B — Home v4 render real */
/**
 * Alertas ativos: lê de `alertas` schema v19 (id serial, texto, nivel, lido, horario).
 * Mapeia nivel('red'/'amber'/etc) → severidade ('critico'/'alto'/'atencao').
 * Tabela ausente → array vazio (graceful).
 */

import { getSupabase } from '../../shared/supabase-client.js';

function nivelToSeveridade(n){
  const v = String(n || '').toLowerCase();
  if(v === 'red' || v === 'critico')   return 'critico';
  if(v === 'amber' || v === 'alto')    return 'alto';
  return 'atencao';
}

function splitTexto(texto){
  // formato comum no monolito: "Empresa — descrição..."
  const m = String(texto || '').match(/^([^—-]+)\s*[—-]\s*(.+)$/);
  if(m) return { empresa: m[1].trim(), titulo: m[2].trim() };
  return { empresa: '', titulo: String(texto || '').trim() };
}

export async function getAlertasAtivos(limite = 10){
  const empty = { critico: [], alto: [], atencao: [], total: 0, items: [] };
  const sb = await getSupabase();
  if(!sb) return empty;
  try{
    const { data, error } = await sb.from('alertas')
      .select('id, texto, nivel, lido, horario, created_at')
      .eq('lido', false)
      .order('id', { ascending: false })
      .limit(limite);
    if(error || !Array.isArray(data)) return empty;
    const buckets = { critico: [], alto: [], atencao: [] };
    const items = [];
    data.forEach(a => {
      const sev = nivelToSeveridade(a.nivel);
      const { empresa, titulo } = splitTexto(a.texto);
      const item = {
        id: a.id, titulo, empresa,
        severidade: sev,
        horario: a.horario || '',
        criadoEm: a.created_at
      };
      buckets[sev].push(item);
      items.push(item);
    });
    return {
      critico: buckets.critico.slice(0, 5),
      alto:    buckets.alto.slice(0, 5),
      atencao: buckets.atencao.slice(0, 5),
      total:   buckets.critico.length + buckets.alto.length + buckets.atencao.length,
      items
    };
  }catch(e){
    console.warn('[alertas] erro:', e && e.message);
    return empty;
  }
}
