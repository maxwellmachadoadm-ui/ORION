/**
 * ORION — auth helpers
 * Ciclo 13A — esqueleto. 13B integra com supabase.auth real.
 *
 * Contrato:
 *   - getCurrentUser() : Promise<{id, email, name} | null>
 *   - requireAuth({ redirectTo='/login' }) : Promise<user>
 *       redireciona se não autenticado.
 *   - signOut() : Promise<void>
 */

import { getSupabase } from './supabase-client.js';

export async function getCurrentUser(){
  const sb = await getSupabase();
  if(!sb){
    // fallback stub: lê localStorage 'session' do monolito
    try{
      const raw = localStorage.getItem('session');
      if(raw){
        const u = JSON.parse(raw);
        return u && u.email ? { id:u.id||u.email, email:u.email, name:u.name||u.nome||'' } : null;
      }
    }catch(e){ /* noop */ }
    return null;
  }
  const { data, error } = await sb.auth.getUser();
  if(error || !data || !data.user) return null;
  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    name: (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || u.email
  };
}

export async function requireAuth(opts = {}){
  const { redirectTo = '/login' } = opts;
  const user = await getCurrentUser();
  if(!user){
    if(typeof window !== 'undefined') window.location.href = redirectTo;
    throw new Error('auth required');
  }
  return user;
}

export async function signOut(){
  const sb = await getSupabase();
  if(sb) await sb.auth.signOut();
  try{ localStorage.removeItem('session'); }catch(e){}
  if(typeof window !== 'undefined') window.location.href = '/';
}
