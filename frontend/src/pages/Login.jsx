import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 32, color: 'var(--gold)' }}>◈</span>
          <p style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--text3)', marginTop: 8, textTransform: 'uppercase' }}>
            Lineage Archive
          </p>
        </div>
        <div className="card">
          <p className="label" style={{ marginBottom: 20 }}>Sign in to your archive</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-gold" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {isLoading ? 'Signing in...' : 'Enter archive'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
          No account? <Link to="/register" style={{ color: 'var(--gold)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
