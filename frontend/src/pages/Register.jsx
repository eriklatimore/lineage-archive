import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', first_name: '', last_name: '', birth_date: '', password: '', password2: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await api.post('/auth/register/', form)
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      setError(data ? Object.values(data).flat().join(' ') : 'Registration failed')
    } finally { setLoading(false) }
  }

  const Field = ({ label, name, type = 'text', required }) => (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[name]} onChange={set(name)} required={required} />
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 32, color: 'var(--gold)' }}>◈</span>
          <p style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--text3)', marginTop: 8, textTransform: 'uppercase' }}>Create your archive node</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="First name" name="first_name" />
              <Field label="Last name" name="last_name" />
            </div>
            <Field label="Email" name="email" type="email" required />
            <Field label="Username" name="username" required />
            <Field label="Date of birth" name="birth_date" type="date" />
            <Field label="Password" name="password" type="password" required />
            <Field label="Confirm password" name="password2" type="password" required />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating...' : 'Create archive'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
          Have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
