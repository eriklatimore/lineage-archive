import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import api from '../api/client'

export default function Timeline() {
  const { user } = useAuthStore()
  const [viewingId, setViewingId] = useState(null)
  const ownerId = viewingId || user?.id

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', ownerId],
    queryFn: () => api.get(`/vault/timeline/${ownerId}/`).then(r => r.data),
    enabled: !!ownerId,
  })

  const { data: permissions = [] } = useQuery({
    queryKey: ['can-view'],
    queryFn: () => api.get('/auth/profile/').then(r =>
      // Users whose timeline I can see
      [] // placeholder — in prod, fetch /vault/timeline/ accessible list
    ),
  })

  const years = data?.years || []
  const timeline = data?.timeline || {}

  return (
    <div className="page">
      <p className="label">Timeline</p>
      <h1 className="page-title">{data?.owner || 'My timeline'}</h1>
      <p className="page-sub">Sealed years — read-only permanent record.</p>

      {isLoading ? (
        <p className="empty">Loading timeline...</p>
      ) : years.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: 28, marginBottom: 8, color: 'var(--border2)' }}>◈</p>
          <p>No sealed years yet.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Complete your first annual compile to begin your lineage.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {years.map(year => (
            <YearBlock key={year} year={year} items={timeline[year] || []} />
          ))}
        </div>
      )}
    </div>
  )
}

function YearBlock({ year, items }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12 }}
      >
        <span style={{ fontSize: 22, fontWeight: 500 }}>{year}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{items.length} items</span>
        <span className="badge badge-sealed">Sealed</span>
        <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 12 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}>
          {items.map(item => (
            <div key={item.id} style={{
              aspectRatio: '1',
              background: 'var(--surface)',
              borderRadius: 6,
              overflow: 'hidden',
              border: '0.5px solid var(--border)',
            }}>
              {item.file_display_url
                ? <img src={item.file_display_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--border2)', fontSize: 20 }}>◈</span>
                  </div>
              }
            </div>
          ))}
        </div>
      )}
      <div style={{ height: '0.5px', background: 'var(--border)', marginTop: 16 }} />
    </div>
  )
}
