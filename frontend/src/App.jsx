import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Vault from './pages/Vault'
import Timeline from './pages/Timeline'
import Lineage from './pages/Lineage'
import Permissions from './pages/Permissions'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { fetchProfile, token } = useAuthStore()

  useEffect(() => {
    if (token) fetchProfile()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout><Vault /></Layout></PrivateRoute>} />
      <Route path="/timeline" element={<PrivateRoute><Layout><Timeline /></Layout></PrivateRoute>} />
      <Route path="/lineage" element={<PrivateRoute><Layout><Lineage /></Layout></PrivateRoute>} />
      <Route path="/permissions" element={<PrivateRoute><Layout><Permissions /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
