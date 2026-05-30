import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

export default function Permissions() {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get('/auth/permissions/').then(r => r.data.results || r.data),
  })

  const grant = useMutation({
    mutationFn: ({ viewer, include_protected_era }) =>
      api.post('/auth/permissions/', { viewer, include_protected_era }),
    onSuccess: () => { qc.invalidateQueries(['permissions']); setSearchResult(null); setEmail('') },
  })

  const revoke = useMutation({
    mutationFn: (id) => api.delete(`/auth/permissions/${id}/`),
    onSuccess: () => qc.invalidateQueries(['permissions']),
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    setSearching(true); setError(null); setSearchResult(null)
    try {
      const { data } = await api.get(`/auth/search/?email=${encodeURIComponent(email)}`)
      setSearchResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'User not found')
    } finally { setSearching(false) }
  }

  return (
    <div className="page">
      <p className="label">Access Keys</p>
      <h1 className="page-title">Viewing permissions</h1>
      <p className="page-sub">Every connection requires an explicit manual key. You control who sees your lineage.</p>

      {/* Grant form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Grant access to a family member</p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Enter their email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-ghost" disabled={searching}>
            {searching ? '...' : 'Find'}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
        {searchResult && (
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{searchResult.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{searchResult.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => grant.mutate({ viewer: searchResult.id, include_protected_era: false })}
              >
                Grant (sovereign only)
              </button>
              <button
                className="btn btn-gold"
                style={{ fontSize: 12 }}
                onClick={() => grant.mutate({ viewer: searchResult.id, include_protected_era: true })}
              >
                Grant full access
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current permissions */}
      <p style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        Active connections — {permissions.length}
      </p>

      {permissions.length === 0 ? (
        <div className="empty">
          <p>No one has access to your archive yet.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Grant access above to share your lineage with family members.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {permissions.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{p.viewer_name}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>{p.viewer_email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge ${p.include_protected_era ? 'badge-pending' : 'badge-sovereign'}`}>
                  {p.include_protected_era ? 'Full access' : 'Sovereign era only'}
                </span>
                <button
                  className="btn"
                  style={{ padding: '5px 10px', fontSize: 12, color: 'var(--red)', borderColor: 'var(--red-dim)' }}
                  onClick={() => revoke.mutate(p.id)}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
