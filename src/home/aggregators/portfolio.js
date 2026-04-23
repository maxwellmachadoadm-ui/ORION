/* Ciclo 13B — Home v4 render real */
/**
 * Portfólio de empresas: lista horizontal (top 6 por health score).
 * Lê de `empresas` schema v19. Exclui pessoal (gp).
 */

import { getSupabase } from '../../shared/supabase-client.js';

function deriveStatus(score, cresc){
  // override por crescimento expressivo
  if(cresc > 20) return { tone:'oportunidade', label:'Oportunidade' };
  if(score >= 70) return { tone:'crescimento', label:'Crescimento' };
  if(score >= 50) return { tone:'atencao',     label:'Atenção' };
  return { tone:'critico', label:'Crítico' };
}

export async function getPortfolioEmpresas(limite = 6){
  const sb = await getSupabase();
  if(!sb) return [];
  try{
    const { data, error } = await sb.from('empresas')
      .select('id, nome, sigla, fat, meta, result, cresc, score, status, status_cor, tipo')
      .neq('tipo', 'pessoal')
      .order('score', { ascending: false })
      .limit(limite);
    if(error || !Array.isArray(data)) return [];
    return data.map(e => {
      const status = deriveStatus(Number(e.score) || 0, Number(e.cresc) || 0);
      return {
        id: e.id,
        nome: e.nome,
        sigla: e.sigla,
        tipo: e.status || 'Portfolio',
        faturamento: Number(e.fat) || 0,
        meta: Number(e.meta) || 0,
        resultado: Number(e.result) || 0,
        crescimento: Number(e.cresc) || 0,
        score: Number(e.score) || 0,
        statusTone: status.tone,
        statusLabel: status.label
      };
    });
  }catch(e){
    console.warn('[portfolio] erro lendo empresas:', e && e.message);
    return [];
  }
}
