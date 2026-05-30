import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

export default function Lineage() {
  const { data, isLoading } = useQuery({
    queryKey: ['family-tree'],
    queryFn: () => api.get('/lineage/tree/').then(r => r.data),
  })

  if (isLoading) return <div className="page"><p className="empty">Loading lineage...</p></div>

  const self = data?.self
  const parents = [data?.paternal_parent, data?.maternal_parent].filter(Boolean)
  const children = [...(data?.paternal_children || []), ...(data?.maternal_children || [])]

  return (
    <div className="page">
      <p className="label">Bloodline</p>
      <h1 className="page-title">Family graph</h1>
      <p className="page-sub">Your directional lineage connections.</p>

      {parents.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Parents
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {parents.map(p => <NodeCard key={p.id} node={p} role="parent" />)}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>You</p>
        <NodeCard node={self} role="self" />
      </div>

      {children.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>Children</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {children.map(c => <NodeCard key={c.id} node={c} role="child" />)}
          </div>
        </div>
      )}

      {parents.length === 0 && children.length === 0 && (
        <div className="empty">
          <p>No connected family nodes yet.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Link parents or create child accounts via the API.</p>
        </div>
      )}
    </div>
  )
}

function NodeCard({ node, role }) {
  if (!node) return null
  const colors = {
    parent: { bg: 'var(--blue-dim)', border: '#1a3a4a', text: 'var(--blue)' },
    self: { bg: 'rgba(200,160,85,.06)', border: 'var(--gold-dim)', text: 'var(--gold)' },
    child: { bg: 'var(--green-dim)', border: '#1a4a2a', text: 'var(--green)' },
  }
  const c = colors[role]
  return (
    <div style={{
      background: c.bg, border: `0.5px solid ${c.border}`,
      borderRadius: 10, padding: '12px 16px', minWidth: 160,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.border, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: c.text }}>{node.name?.[0] || '?'}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500 }}>{node.name}</p>
      <span style={{ fontSize: 10, color: c.text, marginTop: 4, display: 'block' }}>
        {node.account_status === 'SOVEREIGN' ? 'Sovereign' : 'Protected era'}
      </span>
    </div>
  )
}
