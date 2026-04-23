/* Ciclo 13B — Home v4 render real */
/**
 * Insight prioritário do ORION (hero da Home).
 * Heurística determinística sobre `empresas`: escolhe a primeira condição
 * que disparar, em ordem de prioridade.
 *
 * Sem dados → mensagem de boas-vindas / CTA cadastro.
 */

import { getSupabase } from '../../shared/supabase-client.js';

const FALLBACK_WELCOME = {
  titulo: 'Bem-vindo à Central do CEO',
  descricao: 'Conecte suas empresas para começar a receber recomendações priorizadas.',
  empresa: '',
  acao: 'Cadastre sua primeira empresa pelo menu Workspaces.',
  prioridade: 'media',
  impacto: 0,
  acaoLink: '#'
};

const FALLBACK_HEALTHY = {
  titulo: 'Operação saudável',
  descricao: 'Nenhum risco crítico detectado no portfólio neste momento.',
  empresa: '',
  acao: 'Continue acompanhando os KPIs e revise tarefas pendentes.',
  prioridade: 'baixa',
  impacto: 0,
  acaoLink: '#'
};

export async function getOrionInsightPrioritario(){
  const sb = await getSupabase();
  if(!sb) return FALLBACK_WELCOME;
  try{
    const { data, error } = await sb.from('empresas')
      .select('id, nome, fat, meta, result, cresc, score')
      .neq('tipo', 'pessoal');
    if(error || !Array.isArray(data) || data.length === 0) return FALLBACK_WELCOME;

    // Ordem de prioridade dos insights
    // 1) Score crítico (<50)
    const critico = data.filter(e => Number(e.score) < 50)
      .sort((a, b) => Number(a.score) - Number(b.score))[0];
    if(critico){
      return {
        titulo: `Atenção crítica em ${critico.nome}`,
        descricao: `Health score em ${critico.score} — abaixo do mínimo recomendado (50).`,
        empresa: critico.nome,
        acao: `Revise alertas e indicadores de ${critico.nome} no workspace dedicado.`,
        prioridade: 'critico',
        impacto: Math.round(Number(critico.fat) * 0.1),
        acaoLink: `/?emp=${critico.id}`
      };
    }
    // 2) Queda expressiva (cresc <= -10)
    const queda = data.filter(e => Number(e.cresc) <= -10)
      .sort((a, b) => Number(a.cresc) - Number(b.cresc))[0];
    if(queda){
      return {
        titulo: `Queda de resultado em ${queda.nome}`,
        descricao: `Crescimento em ${Number(queda.cresc).toFixed(1)}% — investigue causas.`,
        empresa: queda.nome,
        acao: 'Compare últimos lançamentos com o mês anterior e classifique despesas.',
        prioridade: 'alto',
        impacto: Math.round(Math.abs(Number(queda.result)) * 0.2),
        acaoLink: `/?emp=${queda.id}`
      };
    }
    // 3) Meta abaixo de 50%
    const baixaMeta = data.filter(e => Number(e.meta) > 0 && Number(e.fat) / Number(e.meta) < 0.5)
      .sort((a, b) => (Number(a.fat) / Number(a.meta)) - (Number(b.fat) / Number(b.meta)))[0];
    if(baixaMeta){
      const pct = (Number(baixaMeta.fat) / Number(baixaMeta.meta) * 100).toFixed(0);
      return {
        titulo: `Meta baixa em ${baixaMeta.nome}`,
        descricao: `Apenas ${pct}% da meta mensal atingida (R$ ${(baixaMeta.fat/1000).toFixed(0)}k / R$ ${(baixaMeta.meta/1000).toFixed(0)}k).`,
        empresa: baixaMeta.nome,
        acao: 'Acelere ações comerciais ou revise meta para o próximo ciclo.',
        prioridade: 'alto',
        impacto: Math.round((Number(baixaMeta.meta) - Number(baixaMeta.fat))),
        acaoLink: `/?emp=${baixaMeta.id}`
      };
    }
    // 4) Oportunidade de escala (cresc > 20)
    const escala = data.filter(e => Number(e.cresc) > 20)
      .sort((a, b) => Number(b.cresc) - Number(a.cresc))[0];
    if(escala){
      return {
        titulo: `Oportunidade de escala em ${escala.nome}`,
        descricao: `Crescimento em +${Number(escala.cresc).toFixed(1)}% — momento favorável para investir.`,
        empresa: escala.nome,
        acao: `Reinvista parte do resultado em aquisição ou capacidade operacional.`,
        prioridade: 'media',
        impacto: Math.round(Number(escala.result) * 0.3),
        acaoLink: `/?emp=${escala.id}`
      };
    }
    return FALLBACK_HEALTHY;
  }catch(e){
    console.warn('[insight] erro:', e && e.message);
    return FALLBACK_WELCOME;
  }
}
