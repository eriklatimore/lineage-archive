import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const nav = [
    { path: '/', label: 'Vault', icon: '⬡' },
    { path: '/timeline', label: 'Timeline', icon: '◈' },
    { path: '/lineage', label: 'Lineage', icon: '⬢' },
    { path: '/permissions', label: 'Keys', icon: '◉' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        borderBottom: '0.5px solid var(--border)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, color: 'var(--gold)' }}>◈</span>
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '.06em', color: 'var(--text)' }}>
            Lineage Archive
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: 4 }}>
          {nav.map(n => (
            <Link key={n.path} to={n.path} style={{
              padding: '6px 12px',
              borderRadius: 7,
              fontSize: 13,
              color: location.pathname === n.path ? 'var(--gold)' : 'var(--text3)',
              background: location.pathname === n.path ? 'rgba(200,160,85,.08)' : 'transparent',
              transition: 'all .15s',
            }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {user.first_name || user.email}
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
