/**
 * ORION — supabase-client (singleton)
 * Ciclo 13B — alinhado às convenções do monolito index.html.
 *
 * Resolução de URL+anon (mesma ordem do resolveSupabaseConfig do monolito):
 *   1. window.ORION_ENV.SUPABASE_URL / .SUPABASE_ANON_KEY (build env Vercel)
 *   2. <meta name="orion-sb-url"> / <meta name="orion-sb-key">
 *   3. localStorage('orion_sb_url') / ('orion_sb_key')
 *      (compartilhado com o monolito — usuário já configurou lá)
 *
 * Reusa window.supabaseClient se existir (evita duplicar GoTrueClient
 * quando a Home v4 estiver embutida no shell monolito).
 *
 * Persiste em localStorage o que encontrou via ENV/meta (paridade total
 * com o resolveSupabaseConfig do monolito).
 */

const meta = (name) => {
  if(typeof document === 'undefined') return '';
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? (el.getAttribute('content') || '').trim() : '';
};

function resolveConfig(){
  let url = '', key = '';
  try{
    if(typeof window !== 'undefined' && window.ORION_ENV){
      url = window.ORION_ENV.SUPABASE_URL || window.ORION_ENV.VITE_SUPABASE_URL || '';
      key = window.ORION_ENV.SUPABASE_ANON_KEY || window.ORION_ENV.VITE_SUPABASE_ANON_KEY || '';
    }
  }catch(e){ /* noop */ }
  if(!url) url = meta('orion-sb-url');
  if(!key) key = meta('orion-sb-key');
  if(!url){ try{ url = localStorage.getItem('orion_sb_url') || ''; }catch(e){} }
  if(!key){ try{ key = localStorage.getItem('orion_sb_key') || ''; }catch(e){} }
  // persiste paridade com monolito
  try{
    if(url && !localStorage.getItem('orion_sb_url')) localStorage.setItem('orion_sb_url', url);
    if(key && !localStorage.getItem('orion_sb_key')) localStorage.setItem('orion_sb_key', key);
  }catch(e){}
  return { url, key };
}

async function buildClient(){
  if(typeof window !== 'undefined' && window.supabaseClient){
    return window.supabaseClient;
  }
  const { url, key } = resolveConfig();
  if(!url || !key){
    console.warn('[supabase-client] URL/anon ausente — Home v4 vai operar em modo degradado (sem Supabase).');
    return null;
  }
  try{
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = mod.createClient(url, key, {
      auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
    if(typeof window !== 'undefined') window.supabaseClient = client;
    return client;
  }catch(e){
    console.error('[supabase-client] createClient falhou:', e && e.message);
    return null;
  }
}

export const supabasePromise = buildClient();
export async function getSupabase(){ return supabasePromise; }
export function sbConnected(){ return !!(typeof window !== 'undefined' && window.supabaseClient); }
export const SUPABASE_CONFIG = resolveConfig();
