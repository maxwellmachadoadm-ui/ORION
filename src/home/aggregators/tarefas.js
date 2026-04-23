/* Ciclo 13B — Home v4 render real */
/**
 * Tarefas prioritárias multi-empresa.
 * Lê de `tarefas` schema v19 (texto, prioridade, concluida, empresa_id).
 * Faz join manual com `empresas` (1 query separada, cache local).
 * Filtra texto vazio. Ordena por prioridade (alta > media > baixa).
 */

import { getSupabase } from '../../shared/supabase-client.js';

const PRIO_RANK = { alta: 0, media: 1, baixa: 2 };

function impactoFromPrio(prio){
  if(prio === 'alta')  return 'alto';
  if(prio === 'baixa') return 'baixo';
  return 'medio';
}

export async function getTarefasPrioritarias(limite = 6){
  const sb = await getSupabase();
  if(!sb) return [];
  try{
    const [{ data: tarefas, error: e1 }, { data: emps, error: e2 }] = await Promise.all([
      sb.from('tarefas')
        .select('id, texto, prioridade, concluida, empresa_id, created_at')
        .eq('concluida', false)
        .order('created_at', { ascending: false })
        .limit(40),
      sb.from('empresas').select('id, nome')
    ]);
    if(e1 || !Array.isArray(tarefas)) return [];
    const empMap = {};
    if(Array.isArray(emps)) emps.forEach(e => { empMap[e.id] = e.nome; });

    const items = tarefas
      .map(t => {
        const txt = String(t.texto || '').trim();
        if(!txt) return null;
        const prio = String(t.prioridade || 'media').toLowerCase();
        const prioN = (prio === 'alta' || prio === 'baixa') ? prio : 'media';
        return {
          id: t.id,
          titulo: txt,
          empresa: empMap[t.empresa_id] || t.empresa_id || '',
          prioridade: prioN,
          impacto: impactoFromPrio(prioN),
          origem: 'Manual',
          prazo: '—'
        };
      })
      .filter(Boolean)
      .sort((a, b) => (PRIO_RANK[a.prioridade] - PRIO_RANK[b.prioridade]))
      .slice(0, limite);
    return items;
  }catch(e){
    console.warn('[tarefas] erro:', e && e.message);
    return [];
  }
}
