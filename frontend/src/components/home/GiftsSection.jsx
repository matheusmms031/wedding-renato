import { useCallback, useEffect, useState } from 'react'
import { claimGift, listGifts, unclaimGift } from '../../api/gifts.js'
import { Button, Card, ScriptHeading, SectionLabel } from '../ds/index.js'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function GiftCard({ gift, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action(gift.id)
      await onChange()
    } catch (err) {
      setError(err.message)
      // Outra pessoa pode ter escolhido enquanto esta tela estava aberta.
      if (err.code === 'GIFT_UNAVAILABLE') await onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gift-card" padding="0">
      <div className="gift-card__body">
        <h3 className="gift-card__name">{gift.name}</h3>
        <p className="gift-card__desc">{gift.description}</p>

        {gift.claimedByMe && <p className="gift-card__tag">Você escolheu este presente.</p>}

        <div className="gift-card__foot">
          <span className="gift-card__price">{brl.format(gift.priceCents / 100)}</span>

          {gift.claimedByMe ? (
            <Button variant="secondary" size="sm" onClick={() => run(unclaimGift)} disabled={busy}>
              {busy ? 'Aguarde…' : 'Desfazer'}
            </Button>
          ) : gift.available ? (
            <Button size="sm" onClick={() => run(claimGift)} disabled={busy}>
              {busy ? 'Aguarde…' : 'Presentear'}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled>
              Já escolhido
            </Button>
          )}
        </div>

        {error && (
          <p className="gift-card__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Card>
  )
}

export function GiftsSection() {
  const [gifts, setGifts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  // Usado pelos cards depois de reservar ou desfazer.
  const refresh = useCallback(async () => {
    const { gifts: rows } = await listGifts()
    setGifts(rows)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    listGifts({ signal: controller.signal })
      .then(({ gifts: rows }) => {
        if (ignore) return
        setGifts(rows)
        setStatus('ready')
      })
      .catch((err) => {
        if (ignore || err.name === 'AbortError') return
        setError(err.message)
        setStatus('ready')
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  return (
    <section className="section section--alt gifts" id="presentes">
      <div className="section__head">
        <SectionLabel>Lista de presentes</SectionLabel>
        <ScriptHeading as="h2" size="md">
          Presentes
        </ScriptHeading>
        <p className="gifts__intro">
          Sua presença é o maior presente. Se desejar nos presentear, escolha um item abaixo e nós
          entraremos em contato.
        </p>
      </div>

      {status === 'loading' ? (
        <p className="rsvp__note" role="status">
          Carregando a lista…
        </p>
      ) : error ? (
        <p className="rsvp__error" role="alert">
          {error}
        </p>
      ) : (
        <div className="gifts__grid">
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} onChange={refresh} />
          ))}
        </div>
      )}
    </section>
  )
}
