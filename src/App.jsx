import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import CEO from './pages/CEO'
import Workspace from './pages/Workspace'
import CRM from './pages/CRM'
import Financeiro from './pages/Financeiro'
import Admin from './pages/Admin'
import OriginalFotografia from './pages/OriginalFotografia'
import Arquivo from './pages/Arquivo'
import Classificacoes from './pages/Classificacoes'

// Tela de loading com fallback automático após 8 segundos
function LoadingScreen() {
  const [slow, setSlow] = useState(false)
  const [forced, setForced] = useState(false)

  useEffect(() => {
    // Após 3s: aviso de lentidão
    const t1 = setTimeout(() => setSlow(true), 3000)
    // Após 8s: força saída do loading (fallback absoluto)
    const t2 = setTimeout(() => setForced(true), 8000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Fallback absoluto: recarrega a página em modo demo (sem Supabase)
  if (forced) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14' }}>
        <div style={{ textAlign: 'center', maxWidth: 320, padding: 24 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: 4, background: 'linear-gradient(135deg,#fff,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>ORION</div>
          <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>⚠ Não foi possível conectar ao servidor</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
            O Supabase não respondeu. Verifique as variáveis de ambiente no Vercel ou use o modo demo.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0d1424', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginRight: 8 }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14' }}>
      <div style={{ textAlign: 'center' }}>
        {/* Logo animado */}
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: 5, background: 'linear-gradient(135deg,#fff,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORION</div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 4, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Gestão Executiva</div>

        {/* Spinner */}
        <div style={{ margin: '20px auto', width: 24, height: 24, border: '2px solid #1e2a3d', borderTop: '2px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

        {slow ? (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, letterSpacing: 1 }}>
            Verificando conexão com servidor...
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#475569', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
            Carregando...
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/tarefas"            element={<Tasks />} />
        <Route path="/crm"                element={<CRM />} />
        <Route path="/financeiro"         element={<Financeiro />} />
        <Route path="/ceo"                element={<CEO />} />
        <Route path="/admin"              element={<Admin />} />
        <Route path="/of-projetos"        element={<OriginalFotografia />} />
        <Route path="/empresa/:id"        element={<Workspace />} />
        <Route path="/arquivo"            element={<Arquivo />} />
        <Route path="/classificacoes"     element={<Classificacoes />} />
        <Route path="*"                   element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
