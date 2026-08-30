import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context.js'

export function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()

  // Para "/" e não para "/login": o convidado está autenticado, só não é autorizado.
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}
