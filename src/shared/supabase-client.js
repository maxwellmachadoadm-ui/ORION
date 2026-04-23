/**
 * ORION — supabase-client (singleton)
 * Ciclo 13A — esqueleto do client modular.
 *
 * Estratégia:
 *   1. Se window.supabaseClient já existir (página rodando dentro do shell
 *      monolito index.html), reusa — evita warning "Multiple GoTrueClient
 *      instances detected in the same browser context".
 *   2. Senão (página standalone /src/home/home.html), cria via CDN ESM lendo
 *      url+anon das meta tags do shell:
 *        <meta name="supabase-url"  content="https://xxx.supabase.co">
 *        <meta name="supabase-anon" content="eyJ...">
 *
 * 13A entrega só o singleton. 13B preenche meta tags reais e ativa auth.
 */

const meta = (name) => {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.getAttribute('content') : '';
};

async function buildClient(){
  if(typeof window !== 'undefined' && window.supabaseClient){
    return window.supabaseClient;
  }
  const url = meta('supabase-url');
  const anon = meta('supabase-anon');
  if(!url || !anon){
    console.warn('[supabase-client] meta supabase-url/supabase-anon vazias (stub 13A) — retornando client null.');
    return null;
  }
  const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const client = mod.createClient(url, anon, {
    auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
  if(typeof window !== 'undefined') window.supabaseClient = client;
  return client;
}

export const supabasePromise = buildClient();
export async function getSupabase(){ return supabasePromise; }
export function sbConnected(){ return !!(typeof window !== 'undefined' && window.supabaseClient); }
