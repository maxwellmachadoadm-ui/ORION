// api/env.js — Vercel Function (Ciclo 13C)
// Expõe window.ORION_ENV para a Home v4 (e qualquer página /src/**).
// Lê env vars do Vercel; aceita múltiplos nomes pra cobrir convenções
// usadas no monolito (SUPABASE_URL/ANON_KEY OU VITE_SUPABASE_URL/ANON_KEY).
//
// Anon key publishable é pública por design (RLS protege as linhas).
// Valores hardcoded como fallback final são os mesmos já públicos
// no <meta name="orion-sb-url|key"> do index.html.

const FALLBACK_URL  = 'https://ouwlosgyikffrcdxhucw.supabase.co';
const FALLBACK_ANON = 'sb_publishable_Jev5yRksM1Ott8_azbSVuQ_qvCUBTXV';

export default function handler(req, res){
  const url  = process.env.SUPABASE_URL
            || process.env.VITE_SUPABASE_URL
            || FALLBACK_URL;
  const anon = process.env.SUPABASE_ANON_KEY
            || process.env.VITE_SUPABASE_ANON_KEY
            || FALLBACK_ANON;

  const payload = JSON.stringify({
    SUPABASE_URL: url,
    SUPABASE_ANON: anon,
    SUPABASE_ANON_KEY: anon
  });

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
  res.status(200).send(`window.ORION_ENV = window.ORION_ENV || ${payload};`);
}
