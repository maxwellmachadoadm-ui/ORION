import { useState } from 'react'
import { useData } from '../contexts/DataContext'

const PRIORITY_COLORS = { alta: '#ef4444', media: '#f59e0b', baixa: '#3b82f6' }
const PRIORITY_LABELS = { alta: 'Alta', media: 'Media', baixa: 'Baixa' }
const COLUMNS = [
  { key: 'todo',  label: '📋 A Fazer',       headerClass: 'todo-header' },
  { key: 'doing', label: '🔄 Em Andamento',  headerClass: 'doing-header' },
  { key: 'done',  label: '✅ Concluídas',    headerClass: 'done-header' },
]

const emptyTask = {
  titulo: '',
  descricao: '',
  empresa_id: '',
  prioridade: 'media',
  status: 'todo',
  prazo: '',
}

export default function Tasks() {
  const { tarefas, empresas, addTask, updateTask, deleteTask, loaded } = useData()
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterEmpresa, setFilterEmpresa] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyTask })
  const [dragId, setDragId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  if (!loaded) return <div className="loading">Carregando...</div>

  // Filter
  let filtered = [...tarefas]
  if (filterPriority !== 'all') filtered = filtered.filter(t => t.prioridade === filterPriority)
  if (filterEmpresa !== 'all') filtered = filtered.filter(t => t.empresa_id === filterEmpresa)

  const grouped = {
    todo: filtered.filter(t => t.status === 'todo'),
    doing: filtered.filter(t => t.status === 'doing'),
    done: filtered.filter(t => t.status === 'done'),
  }

  function getEmpNome(id) {
    const e = empresas.find(x => x.id === id)
    return e ? e.sigla : id
  }

  function getEmpCor(id) {
    const e = empresas.find(x => x.id === id)
    return e ? e.cor : '#666'
  }

  async function handleAdd() {
    if (!form.titulo.trim()) return
    await addTask({
      titulo: form.titulo,
      descricao: form.descricao,
      empresa_id: form.empresa_id || empresas[0]?.id || '',
      prioridade: form.prioridade,
      status: form.status,
      prazo: form.prazo || null,
    })
    setForm({ ...emptyTask })
    setShowModal(false)
  }

  // ── Drag and Drop handlers ──
  function handleDragStart(e, taskId) {
    setDragId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    // Make card semi-transparent while dragging
    setTimeout(() => {
      e.target.style.opacity = '0.4'
    }, 0)
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '1'
    setDragId(null)
    setDragOverCol(null)
  }

  function handleDragOver(e, colKey) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colKey) setDragOverCol(colKey)
  }

  function handleDragLeave(e, colKey) {
    // Only clear if we're actually leaving the column
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null)
    }
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain') || dragId
    if (!taskId) return
    const task = tarefas.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      await updateTask(taskId, { status: newStatus })
    }
    setDragId(null)
  }

  function TaskCard({ task }) {
    return (
      <div
        className="card task-card"
        style={{
          borderLeft: `4px solid ${PRIORITY_COLORS[task.prioridade] || '#666'}`,
          cursor: 'grab',
          opacity: dragId === task.id ? 0.4 : 1,
          transition: 'opacity .15s, transform .15s',
        }}
        draggable
        onDragStart={e => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="task-card-header">
          <span className="badge" style={{ background: getEmpCor(task.empresa_id) }}>
            {getEmpNome(task.empresa_id)}
          </span>
          <span className="badge priority-badge" style={{ background: PRIORITY_COLORS[task.prioridade] || '#666' }}>
            {PRIORITY_LABELS[task.prioridade] || task.prioridade}
          </span>
        </div>
        <p className="task-title">{task.titulo}</p>
        {task.descricao && <p className="task-desc">{task.descricao}</p>}
        {task.prazo && <p className="task-date">📅 {task.prazo}</p>}
        <div className="task-actions">
          {task.status === 'todo' && (
            <button className="btn btn-sm btn-doing" onClick={() => updateTask(task.id, { status: 'doing' })}>
              ▶ Iniciar
            </button>
          )}
          {task.status === 'doing' && (
            <>
              <button className="btn btn-sm btn-done" onClick={() => updateTask(task.id, { status: 'done' })}>
                ✅ Concluir
              </button>
              <button className="btn btn-sm btn-back" onClick={() => updateTask(task.id, { status: 'todo' })}>
                ↩ Voltar
              </button>
            </>
          )}
          {task.status === 'done' && (
            <button className="btn btn-sm btn-reopen" onClick={() => updateTask(task.id, { status: 'todo' })}>
              🔄 Reabrir
            </button>
          )}
          <button className="btn btn-sm btn-del" onClick={() => deleteTask(task.id)}>🗑</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page tasks">
      <div className="page-header">
        <h1>Quadro de Tarefas</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Tarefa</button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Prioridade:</label>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Empresa:</label>
          <select value={filterEmpresa} onChange={e => setFilterEmpresa(e.target.value)}>
            <option value="all">Todas</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.sigla} — {emp.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <div className="kanban">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className="kanban-col"
            onDragOver={e => handleDragOver(e, col.key)}
            onDragLeave={e => handleDragLeave(e, col.key)}
            onDrop={e => handleDrop(e, col.key)}
            style={{
              transition: 'box-shadow .2s, border-color .2s',
              boxShadow: dragOverCol === col.key ? '0 0 0 2px var(--gold), 0 0 20px rgba(245,158,11,.15)' : 'none',
              borderRadius: 12,
            }}
          >
            <div className={`kanban-col-header ${col.headerClass}`}>
              <h3>{col.label}</h3>
              <span className="count">{grouped[col.key].length}</span>
            </div>
            <div className="kanban-col-body" style={{ minHeight: 100 }}>
              {grouped[col.key].map(t => <TaskCard key={t.id} task={t} />)}
              {grouped[col.key].length === 0 && dragOverCol === col.key && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--gold)', fontSize: 13, border: '2px dashed var(--gold)', borderRadius: 8, opacity: 0.6 }}>
                  Soltar aqui
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="g4 task-stats">
        <div className="card kpi-card">
          <span className="lbl">Total</span>
          <span className="val">{filtered.length}</span>
        </div>
        <div className="card kpi-card">
          <span className="lbl">A Fazer</span>
          <span className="val" style={{ color: '#ef4444' }}>{grouped.todo.length}</span>
        </div>
        <div className="card kpi-card">
          <span className="lbl">Em Andamento</span>
          <span className="val" style={{ color: '#f59e0b' }}>{grouped.doing.length}</span>
        </div>
        <div className="card kpi-card">
          <span className="lbl">Concluidas</span>
          <span className="val" style={{ color: '#10b981' }}>{grouped.done.length}</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Tarefa</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Titulo</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Titulo da tarefa"
                />
              </div>
              <div className="form-group">
                <label>Descricao</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descricao (opcional)"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Empresa</label>
                  <select value={form.empresa_id} onChange={e => setForm({ ...form, empresa_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.sigla} — {emp.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridade</label>
                  <select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">A Fazer</option>
                    <option value="doing">Em Andamento</option>
                    <option value="done">Concluida</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prazo</label>
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={e => setForm({ ...form, prazo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd}>Criar Tarefa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
