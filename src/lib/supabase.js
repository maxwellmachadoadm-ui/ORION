import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Valida se as vars são valores reais (não placeholder)
const isValidUrl = url && url.startsWith('https://') && url.includes('.supabase.co')
const isValidKey = key && key.length > 20 && !key.includes('YOUR_')

if (!isValidUrl || !isValidKey) {
  console.warn('ORION: Supabase env vars ausentes ou inválidas. Modo demo ativo (localStorage).')
}

export const supabase = isValidUrl && isValidKey ? createClient(url, key) : null
export const isDemoMode = !supabase
