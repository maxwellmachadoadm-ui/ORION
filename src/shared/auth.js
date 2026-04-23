/**
 * ORION — auth helpers
 * Ciclo 13B — versão graceful: nenhum redirect duro.
 *
 * Decisão: o monolito não expõe /login dedicado. requireAuth() retorna user
 * ou null, e a Home v4 decide se renderiza modo VISITANTE com prompt ou
 * dashboard real. Evita redirect quebrado para rota inexistente.
 */

import { getSupabase } from './supabase-client.js';

export async function getCurrentUser(){
  const sb = await getSupabase();
  if(sb){
    try{
      const { data, error } = await sb.auth.getUser();
      if(!error && data && data.user){
        const u = data.user;
        return {
          id: u.id,
          email: u.email,
          name: (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || u.email,
          source: 'supabase'
        };
      }
    }catch(e){ /* fall through pra fallback */ }
  }
  // Fallback: lê session do monolito (mesmo localStorage)
  try{
    const raw = localStorage.getItem('session');
    if(raw){
      const u = JSON.parse(raw);
      if(u && u.email) return {
        id: u.id || u.email, email: u.email, name: u.name || u.nome || u.email, source: 'local'
      };
    }
  }catch(e){}
  return null;
}

/**
 * requireAuth — retorna user ou null. NÃO redireciona (não há /login).
 * Caller decide o que fazer (renderizar VISITANTE, mostrar CTA, etc).
 */
export async function requireAuth(){
  return getCurrentUser();
}

export async function signOut(){
  const sb = await getSupabase();
  if(sb){ try{ await sb.auth.signOut(); }catch(e){} }
  try{ localStorage.removeItem('session'); }catch(e){}
}
