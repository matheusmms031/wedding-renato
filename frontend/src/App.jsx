import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { RequireAdmin } from './auth/RequireAdmin.jsx'
import { RequireAuth } from './auth/RequireAuth.jsx'
import { Admin } from './pages/Admin.jsx'
import { Home } from './pages/Home.jsx'
import { Login } from './pages/Login.jsx'
import './components/ds/ds.css'
import './components/layout/layout.css'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
