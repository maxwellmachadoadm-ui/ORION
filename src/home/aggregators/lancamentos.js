/* Ciclo 13B — Home v4 render real */
/**
 * Últimos lançamentos financeiros (consolidado multi-empresa).
 * Lê de `lancamentos` schema v19. Top 5 por data desc.
 * Empty → caller renderiza CTA "Enviar extrato".
 */

import { getSupabase } from '../../shared/supabase-client.js';

export async function getUltimosLancamentos(limite = 5){
  const sb = await getSupabase();
  if(!sb) return [];
  try{
    const [{ data: lancs, error }, { data: emps }] = await Promise.all([
      sb.from('lancamentos')
        .select('id, empresa_id, type, descricao, valor, data, categoria, status, created_at')
        .order('data', { ascending: false })
        .limit(limite),
      sb.from('empresas').select('id, nome, sigla')
    ]);
    if(error || !Array.isArray(lancs)) return [];
    const empMap = {};
    if(Array.isArray(emps)) emps.forEach(e => { empMap[e.id] = { nome: e.nome, sigla: e.sigla }; });
    return lancs.map(l => {
      const emp = empMap[l.empresa_id] || { nome: l.empresa_id || '', sigla: '' };
      return {
        id: l.id,
        descricao: l.descricao || '(sem descrição)',
        valor: Number(l.valor) || 0,
        type: l.type === 'income' ? 'income' : 'expense',
        data: l.data,
        categoria: l.categoria || '',
        status: l.status || 'confirmado',
        empresaNome: emp.nome,
        empresaSigla: emp.sigla
      };
    });
  }catch(e){
    console.warn('[lancamentos] erro:', e && e.message);
    return [];
  }
}
