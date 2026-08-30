import { useEffect, useState } from 'react'
import { getRsvp, saveRsvp } from '../../api/rsvp.js'
import { useAuth } from '../../auth/auth-context.js'
import { Button, Card, Input, ScriptHeading, SectionLabel, Textarea } from '../ds/index.js'

export function RSVPSection() {
  const { user } = useAuth()

  const [status, setStatus] = useState('loading')
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)

  const [attending, setAttending] = useState(true)
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')

  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    getRsvp({ signal: controller.signal })
      .then(({ rsvp }) => {
        if (ignore) return
        if (rsvp) {
          setAlreadyAnswered(true)
          setAttending(rsvp.attending)
          setFullName(rsvp.fullName)
          setMessage(rsvp.message ?? '')
        } else {
          setFullName(user?.displayName ?? '')
        }
        setStatus('idle')
      })
      .catch((error) => {
        if (ignore || error.name === 'AbortError') return
        setFormError(error.message)
        setStatus('idle')
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [user])

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldError('')
    setFormError('')

    if (!fullName.trim()) {
      setFieldError('Informe seu nome completo.')
      return
    }

    setStatus('saving')
    try {
      await saveRsvp({
        attending,
        fullName: fullName.trim(),
        message: message.trim() || undefined,
      })
      setAlreadyAnswered(true)
      setStatus('saved')
    } catch (error) {
      setFormError(error.message)
      setStatus('idle')
    }
  }

  const busy = status === 'saving'

  return (
    <section className="section rsvp" id="rsvp">
      <div className="section__head">
        <SectionLabel>Confirme sua presença</SectionLabel>
        <ScriptHeading as="h2" size="md">
          RSVP
        </ScriptHeading>
      </div>

      <Card className="rsvp__card">
        {status === 'loading' ? (
          <p className="rsvp__note" role="status">
            Carregando sua confirmação…
          </p>
        ) : status === 'saved' ? (
          <div className="rsvp__confirmation" role="status">
            <p>
              {attending
                ? `Obrigado, ${fullName}! Sua presença está confirmada.`
                : `Que pena, ${fullName}. Sentiremos sua falta.`}
            </p>
            <p>Nos vemos em 20 de dezembro de 2026.</p>
            <Button variant="secondary" size="sm" onClick={() => setStatus('idle')}>
              Alterar resposta
            </Button>
          </div>
        ) : (
          <form className="rsvp__form" onSubmit={handleSubmit} noValidate>
            {alreadyAnswered && (
              <p className="rsvp__note">Você já respondeu — pode alterar quando quiser.</p>
            )}

            {/* O design system não tem primitivo de rádio; dois Button alternando
                variante resolvem sem inventar componente novo. */}
            <div className="rsvp__toggle" role="group" aria-label="Você vai comparecer?">
              <Button
                variant={attending ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAttending(true)}
                disabled={busy}
              >
                Vou comparecer
              </Button>
              <Button
                variant={attending ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setAttending(false)}
                disabled={busy}
              >
                Não poderei ir
              </Button>
            </div>

            <Input
              label="Nome completo"
              name="nome"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              required
              disabled={busy}
              hint="Como deve aparecer na recepção."
              error={fieldError}
            />

            <Textarea
              label="Recado para os noivos"
              name="recado"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Opcional"
              rows={3}
              maxLength={500}
              disabled={busy}
            />

            {formError && (
              <p className="rsvp__error" role="alert">
                {formError}
              </p>
            )}

            <div className="rsvp__submit">
              <Button type="submit" block disabled={busy}>
                {busy ? 'Enviando…' : 'Confirmar'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </section>
  )
}
