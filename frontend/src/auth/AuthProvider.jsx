import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { AuthContext } from './auth-context.js'

/**
 * Autenticação da área dos convidados.
 *
 * A fonte de verdade é o cookie httpOnly emitido pelo backend — nada é
 * espelhado em sessionStorage, que seria uma cópia velha e legível por XSS.
 * Na montagem, `GET /api/auth/session` diz se já existe sessão válida.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [bootstrapError, setBootstrapError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    authApi
      .getSession({ signal: controller.signal })
      .then(({ user: current }) => {
        if (ignore) return
        setUser(current)
        setStatus('authenticated')
      })
      .catch((error) => {
        if (ignore || error.name === 'AbortError') return
        // 401 é o caso normal de quem ainda não entrou. Qualquer outro erro é
        // backend fora do ar — guardamos para a tela de login poder explicar.
        if (error.status !== 401) setBootstrapError(error.message)
        setStatus('anonymous')
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  const signIn = useCallback(async (username, password) => {
    const { user: current } = await authApi.login(username, password)
    setUser(current)
    setStatus('authenticated')
    setBootstrapError('')
    return current
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      // Mesmo com falha de rede o convidado sai daqui.
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const refresh = useCallback(async () => {
    const { user: current } = await authApi.getSession()
    setUser(current)
    return current
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      bootstrapError,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      signIn,
      signOut,
      refresh,
    }),
    [user, status, bootstrapError, signIn, signOut, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
