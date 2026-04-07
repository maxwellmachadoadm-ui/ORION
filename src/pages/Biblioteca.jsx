import { useState, useRef } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

function FileIcon({ tipo }) {
  if (tipo?.includes('pdf')) return <span style={{ color: '#ef4444', fontSize: 20 }}>📄</span>
  if (tipo?.includes('word') || tipo?.includes('document')) return <span style={{ color: '#3b82f6', fontSize: 20 }}>📝</span>
  if (tipo?.includes('excel') || tipo?.includes('sheet')) return <span style={{ color: '#10b981', fontSize: 20 }}>📊</span>
  if (tipo?.includes('image')) return <span style={{ color: '#8b5cf6', fontSize: 20 }}>🖼</span>
  return <span style={{ fontSize: 20 }}>📁</span>
}

export default function Biblioteca({ empresaId }) {
  const { getBiblioteca, uploadBibliotecaFile, deleteBibliotecaItem } = useData()
  const { canDelete, profile } = useAuth()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDesc, setUploadDesc] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const docs = getBiblioteca(empresaId).filter(d =>
    !search || d.nome.toLowerCase().includes(search.toLowerCase()) || (d.descricao || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleFiles(files) {
    if (!files?.length) return
    setUploading(true)
    setFeedback(null)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { setFeedback({ type: 'err', msg: `${file.name}: arquivo muito grande (máx 20MB)` }); continue }
        await uploadBibliotecaFile(empresaId, file, uploadDesc)
      }
      setFeedback({ type: 'ok', msg: `${files.length} arquivo(s) enviado(s) com sucesso!` })
      setShowUpload(false)
      setUploadDesc('')
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'err', msg: 'Erro ao enviar: ' + err.message })
    }
    setUploading(false)
  }

  async function handleDelete(item) {
    if (!canDelete) return
    if (!confirm(`Deletar "${item.nome}"? Esta ação não pode ser desfeita.`)) return
    await deleteBibliotecaItem(item.id)
  }

  const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv'

  return (
    <div>
      {/* Header */}
      <div className="flex aic jsb mb">
        <div className="slbl" style={{ margin: 0 }}>📚 Biblioteca de Documentos ({docs.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>+ Enviar Documento</button>
      </div>

      {/* Search */}
      <input className="inp" style={{ marginBottom: 16, maxWidth: 360 }} placeholder="Buscar documentos..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Feedback */}
      {feedback && (
        <div className={`notification-bar ${feedback.type === 'ok' ? 'success' : 'danger'}`} style={{ marginBottom: 12 }}>
          {feedback.type === 'ok' ? '✅ ' : '⚠ '}{feedback.msg}
        </div>
      )}

      {/* Upload area */}
      {showUpload && (
        <div className="module-card mb" style={{ border: '1px dashed var(--border2)' }}>
          <div className="module-card-title">📤 Enviar Documento</div>
          <div
            style={{
              border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border2)'}`,
              borderRadius: 10, padding: 32, textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'rgba(245,158,11,0.05)' : 'transparent', marginBottom: 12, transition: '.2s'
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          >
            {uploading
              ? <div style={{ color: 'var(--gold)', fontSize: 13 }}>⏳ Enviando...</div>
              : <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Arraste arquivos ou clique para selecionar</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PDF, Word, Excel, imagens · Máx 20MB por arquivo</div>
                </>
            }
          </div>
          <input className="inp" placeholder="Descrição (opcional)" value={uploadDesc}
            onChange={e => setUploadDesc(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(false)}>Cancelar</button>
          </div>
          <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {/* Document list */}
      {docs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📚</div>
          <p>Nenhum documento encontrado. Envie o primeiro documento desta empresa.</p>
        </div>
      ) : (
        <div className="module-card">
          <table className="exec-table">
            <thead>
              <tr><th>Arquivo</th><th>Descrição</th><th>Tamanho</th><th>Enviado por</th><th>Data</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileIcon tipo={d.tipo} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{d.nome}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono', monospace" }}>{d.tipo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.descricao || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtSize(d.tamanho)}</td>
                  <td style={{ fontSize: 12 }}>{d.uploaded_name || '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.url && d.url !== '#' && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                          👁 Ver
                        </a>
                      )}
                      {d.url && d.url !== '#' && (
                        <a href={d.url} download={d.nome} className="btn btn-icon btn-sm" title="Download">⬇</a>
                      )}
                      {canDelete && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)} title="Deletar">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="modal-overlay show" onClick={() => setPreview(null)}>
          <div className="modal" style={{ maxWidth: 800, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>{preview.nome}</span>
              <button className="modal-close" onClick={() => setPreview(null)}>×</button>
            </div>
            {preview.tipo?.includes('image')
              ? <img src={preview.url} alt={preview.nome} style={{ maxWidth: '100%', borderRadius: 8 }} />
              : <iframe src={preview.url} title={preview.nome} style={{ width: '100%', height: 500, border: 'none', borderRadius: 8 }} />
            }
          </div>
        </div>
      )}
    </div>
  )
}
