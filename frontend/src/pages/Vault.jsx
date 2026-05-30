import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

export default function Vault() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('UNAPPROVED_STORAGE')
  const [uploading, setUploading] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['vault', filter],
    queryFn: () => api.get(`/vault/items/?status=${filter}`).then(r => r.data.results || r.data),
  })

  const { data: gates = [] } = useQuery({
    queryKey: ['gates'],
    queryFn: () => api.get('/vault/gates/').then(r => r.data.results || r.data),
  })

  const triage = useMutation({
    mutationFn: ({ id, action }) => api.post(`/vault/items/${id}/triage/`, { action }),
    onSuccess: () => qc.invalidateQueries(['vault']),
  })

  const compile = useMutation({
    mutationFn: (year) => api.post(`/vault/compile/${year}/`),
    onSuccess: () => { qc.invalidateQueries(['gates']); qc.invalidateQueries(['vault']) },
  })

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('timestamp', new Date().toISOString())
    await api.post('/vault/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    qc.invalidateQueries(['vault'])
    setUploading(false)
    e.target.value = ''
  }

  const currentYear = new Date().getFullYear()
  const currentGate = gates.find(g => g.target_year === currentYear)
  const totalItems = items.length

  const filters = [
    { key: 'UNAPPROVED_STORAGE', label: 'Unreviewed' },
    { key: 'QUEUED_COMPILE', label: 'Queued' },
    { key: 'LINEAGE_POSTED', label: 'Posted' },
  ]

  return (
    <div className="page">
      <p className="label">Vault</p>
      <h1 className="page-title">{currentYear} Archive</h1>
      <p className="page-sub">Your private vault — silently accumulating.</p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total stored', val: totalItems },
          { label: 'Queued to compile', val: currentGate?.queued_count ?? 0 },
          { label: 'Gate status', val: currentGate?.is_locked ? 'Sealed' : 'Open' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 18, fontWeight: 500 }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Annual compile gates */}
      {gates.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p className="label" style={{ marginBottom: 12 }}>Annual compile gates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gates.map(gate => (
              <div key={gate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{gate.target_year}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text3)' }}>
                    {gate.is_locked ? `${gate.item_count} items sealed` : `${gate.queued_count} queued`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${gate.is_locked ? 'badge-sealed' : 'badge-locked'}`}>
                    {gate.is_locked ? 'Sealed' : 'Open'}
                  </span>
                  {!gate.is_locked && gate.queued_count > 0 && (
                    <button
                      className="btn btn-green"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                      onClick={() => compile.mutate(gate.target_year)}
                      disabled={compile.isPending}
                    >
                      [ Allow Post ]
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : '+ Add to vault'}
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '0.5px solid',
              borderColor: filter === f.key ? 'var(--gold-dim)' : 'var(--border)',
              color: filter === f.key ? 'var(--gold)' : 'var(--text3)',
              background: filter === f.key ? 'rgba(200,160,85,.08)' : 'transparent',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {isLoading ? (
        <p className="empty">Loading vault...</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: 28, marginBottom: 8, color: 'var(--border2)' }}>◈</p>
          <p>No items in this view.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {items.map(item => (
            <VaultCard key={item.id} item={item} onTriage={(action) => triage.mutate({ id: item.id, action })} />
          ))}
        </div>
      )}
    </div>
  )
}

function VaultCard({ item, onTriage }) {
  const date = new Date(item.timestamp)
  const statusColors = {
    UNAPPROVED_STORAGE: 'var(--text3)',
    QUEUED_COMPILE: 'var(--blue)',
    LINEAGE_POSTED: 'var(--green)',
  }
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ aspectRatio: '1', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {item.file_display_url
          ? <img src={item.file_display_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 24, color: 'var(--border2)' }}>◈</span>
        }
        <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: statusColors[item.status] }} />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {item.status === 'UNAPPROVED_STORAGE' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onTriage('keep')} style={{ flex: 1, padding: '4px', fontSize: 11, background: 'var(--green-dim)', color: 'var(--green)', border: '0.5px solid var(--green)', borderRadius: 5 }}>Keep</button>
            <button onClick={() => onTriage('queue')} style={{ flex: 1, padding: '4px', fontSize: 11, background: 'var(--blue-dim)', color: 'var(--blue)', border: '0.5px solid var(--blue)', borderRadius: 5 }}>Queue</button>
            <button onClick={() => onTriage('delete')} style={{ flex: 1, padding: '4px', fontSize: 11, background: 'var(--red-dim)', color: 'var(--red)', border: '0.5px solid var(--red)', borderRadius: 5 }}>Del</button>
          </div>
        )}
      </div>
    </div>
  )
}
