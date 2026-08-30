import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/layout/PageLoader.jsx'
import { useAuth } from './auth-context.js'

export function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  // Sem este portão, todo refresh de "/" pisca um redirect para /login antes da
  // chamada de sessão resolver, e o convidado perde onde estava.
  if (status === 'loading') return <PageLoader />

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
