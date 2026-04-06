import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 900, letterSpacing: 4, background: 'linear-gradient(135deg,#fff,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORION</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Carregando...</div>
        </div>
      </div>
    )
  }

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
        <Route path="*"                   element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
