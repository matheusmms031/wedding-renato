import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Monogram } from '../components/ds/index.js'
import { useAuth } from '../auth/auth-context.js'
import './Login.css'

export function Login() {
  const { signIn, status, bootstrapError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await signIn(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  // Quem já tem sessão válida não precisa ver o formulário.
  if (status === 'authenticated') return <Navigate to={from} replace />

  return (
    <main className="login">
      <Card className="login__card" padding="var(--space-7)">
        <div className="login__inner">
          <header className="login__head">
            <Monogram size={30} />
            <p className="login__eyebrow">Área dos convidados</p>
            <p className="login__intro">
              Entre com os dados que enviamos no seu convite para confirmar presença.
            </p>
          </header>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Nome de usuário"
              name="usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Seu usuário"
              autoComplete="username"
              required
            />
            <Input
              label="Senha"
              name="senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {(error || bootstrapError) && (
              <p className="login__error" role="alert">
                {error || bootstrapError}
              </p>
            )}
            <Button type="submit" block disabled={pending}>
              {pending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="login__foot">20 de dezembro de 2026 · Palmas TO</p>
        </div>
      </Card>
    </main>
  )
}
