import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminApi from '../api/admin.js'
import { useAuth } from '../auth/auth-context.js'
import {
  Button,
  Card,
  Input,
  Monogram,
  ScriptHeading,
  SectionLabel,
  Select,
  Textarea,
} from '../components/ds/index.js'
import { PageLoader } from '../components/layout/PageLoader.jsx'
import './Admin.css'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'confirmacoes', label: 'Confirmações' },
  { id: 'convidados', label: 'Convidados' },
  { id: 'presentes', label: 'Presentes' },
]

const EMPTY_GUEST = { username: '', displayName: '', password: '', role: 'guest' }
const EMPTY_GIFT = { slug: '', name: '', description: '', priceCents: '', quantity: '1' }

function fetchAll(signal) {
  return Promise.all([
    adminApi.getSummary({ signal }),
    adminApi.listRsvps({ signal }),
    adminApi.listGuests({ signal }),
    adminApi.listGifts({ signal }),
  ])
}

function Tiles({ summary }) {
  const tiles = [
    { label: 'Convites', value: summary.totalUsers },
    { label: 'Confirmados', value: summary.attending },
    { label: 'Recusaram', value: summary.declined },
    { label: 'Sem resposta', value: summary.pending },
  ]

  return (
    <div className="admin__tiles">
      {tiles.map((tile) => (
        <Card key={tile.label} className="admin__tile" padding="var(--space-5)">
          <span className="admin__tile-value">{tile.value}</span>
          <span className="admin__tile-label">{tile.label}</span>
        </Card>
      ))}
    </div>
  )
}

export function Admin() {
  const { user } = useAuth()

  const [tab, setTab] = useState('resumo')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [summary, setSummary] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [guests, setGuests] = useState([])
  const [gifts, setGifts] = useState([])

  const [guestForm, setGuestForm] = useState(EMPTY_GUEST)
  const [giftForm, setGiftForm] = useState(EMPTY_GIFT)
  const [busy, setBusy] = useState(false)
  const [resettingId, setResettingId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  const apply = useCallback(([summaryData, rsvpData, guestData, giftData]) => {
    setSummary(summaryData)
    setRsvps(rsvpData.rsvps)
    setGuests(guestData.guests)
    setGifts(giftData.gifts)
  }, [])

  const reload = useCallback(async () => apply(await fetchAll()), [apply])

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    fetchAll(controller.signal)
      .then((data) => {
        if (ignore) return
        apply(data)
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
  }, [apply])

  /** Envolve toda ação de escrita: limpa avisos, recarrega e mostra o erro do backend. */
  async function run(action, successMessage) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      await reload()
      if (successMessage) setNotice(successMessage)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateGuest(event) {
    event.preventDefault()
    const ok = await run(
      () =>
        adminApi.createGuest({
          username: guestForm.username.trim().toLowerCase(),
          displayName: guestForm.displayName.trim(),
          password: guestForm.password,
          role: guestForm.role,
        }),
      'Convidado criado.',
    )
    if (ok) setGuestForm(EMPTY_GUEST)
  }

  async function handleCreateGift(event) {
    event.preventDefault()
    const ok = await run(
      () =>
        adminApi.createGift({
          slug: giftForm.slug.trim().toLowerCase(),
          name: giftForm.name.trim(),
          description: giftForm.description.trim(),
          priceCents: Math.round(Number(giftForm.priceCents) * 100) || 0,
          quantity: Number(giftForm.quantity) || 1,
        }),
      'Presente criado.',
    )
    if (ok) setGiftForm(EMPTY_GIFT)
  }

  async function handleResetPassword(guest) {
    if (!newPassword.trim()) return
    const ok = await run(
      () => adminApi.resetGuestPassword(guest.id, newPassword),
      `Senha de ${guest.displayName} redefinida — as sessões abertas foram encerradas.`,
    )
    if (ok) {
      setNewPassword('')
      setResettingId(null)
    }
  }

  // Confirmação em dois cliques em vez de window.confirm: diálogo nativo trava a
  // aba e some com o contexto da linha que está sendo excluída.
  async function handleDeleteGuest(guest) {
    if (confirmingId !== guest.id) {
      setConfirmingId(guest.id)
      return
    }
    const ok = await run(() => adminApi.deleteGuest(guest.id), 'Convidado excluído.')
    if (ok) setConfirmingId(null)
  }

  if (status === 'loading') return <PageLoader label="Carregando o painel…" />

  return (
    <main className="admin">
      <header className="admin__head">
        <Monogram size={28} />
        <SectionLabel>Painel dos noivos</SectionLabel>
        <ScriptHeading as="h1" size="md">
          Administração
        </ScriptHeading>
        <Link className="site-nav__link" to="/">
          Voltar ao site
        </Link>
      </header>

      <div className="admin__body">
        <div className="admin__tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className="admin__tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="admin__message admin__message--error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin__message" role="status">
            {notice}
          </p>
        )}

        {tab === 'resumo' && summary && <Tiles summary={summary} />}

        {tab === 'confirmacoes' && (
          <Card padding="var(--space-5)">
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Convidado</th>
                    <th>Nome informado</th>
                    <th>Resposta</th>
                    <th>Recado</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.length === 0 ? (
                    <tr>
                      <td colSpan={4} data-label="">Ninguém respondeu ainda.</td>
                    </tr>
                  ) : (
                    rsvps.map((row) => (
                      <tr key={row.id}>
                        <td data-label="Convidado">{row.displayName}</td>
                        <td data-label="Nome informado">{row.fullName}</td>
                        <td data-label="Resposta">{row.attending ? 'Confirmado' : 'Não vai'}</td>
                        <td data-label="Recado">{row.message ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'convidados' && (
          <>
            <Card padding="var(--space-5)">
              <h2 className="admin__section-title">Novo convidado</h2>
              <form className="admin__form" onSubmit={handleCreateGuest}>
                <Input
                  label="Usuário"
                  value={guestForm.username}
                  onChange={(e) => setGuestForm({ ...guestForm, username: e.target.value })}
                  placeholder="ana.silva"
                  required
                  disabled={busy}
                />
                <Input
                  label="Nome exibido"
                  value={guestForm.displayName}
                  onChange={(e) => setGuestForm({ ...guestForm, displayName: e.target.value })}
                  placeholder="Ana Silva"
                  required
                  disabled={busy}
                />
                <Input
                  label="Senha inicial"
                  type="password"
                  value={guestForm.password}
                  onChange={(e) => setGuestForm({ ...guestForm, password: e.target.value })}
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
                <Select
                  label="Perfil"
                  value={guestForm.role}
                  onChange={(e) => setGuestForm({ ...guestForm, role: e.target.value })}
                  options={[
                    { value: 'guest', label: 'Convidado' },
                    { value: 'admin', label: 'Administrador' },
                  ]}
                  disabled={busy}
                />
                <div className="admin__form-actions">
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Salvando…' : 'Criar convidado'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card padding="var(--space-5)">
              <div className="admin__table-wrap">
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>Convidado</th>
                      <th>Usuário</th>
                      <th>Perfil</th>
                      <th>Resposta</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest) => (
                      <tr key={guest.id}>
                        <td data-label="Convidado">{guest.displayName}</td>
                        <td data-label="Usuário">{guest.username}</td>
                        <td data-label="Perfil">
                          {guest.role === 'admin' ? 'Administrador' : 'Convidado'}
                        </td>
                        <td data-label="Resposta">{guest.rsvpStatus}</td>
                        <td data-label="Ações">
                          <div className="admin__actions">
                            {resettingId === guest.id ? (
                              <>
                                <Input
                                  label="Nova senha"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  autoComplete="new-password"
                                  disabled={busy}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => void handleResetPassword(guest)}
                                  disabled={busy}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setResettingId(null)
                                    setNewPassword('')
                                  }}
                                  disabled={busy}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setResettingId(guest.id)
                                  setNewPassword('')
                                }}
                                disabled={busy}
                              >
                                Nova senha
                              </Button>
                            )}
                            {guest.id !== user.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleDeleteGuest(guest)}
                                disabled={busy}
                              >
                                {confirmingId === guest.id ? 'Confirmar exclusão' : 'Excluir'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {tab === 'presentes' && (
          <>
            <Card padding="var(--space-5)">
              <h2 className="admin__section-title">Novo presente</h2>
              <form className="admin__form" onSubmit={handleCreateGift}>
                <Input
                  label="Identificador"
                  value={giftForm.slug}
                  onChange={(e) => setGiftForm({ ...giftForm, slug: e.target.value })}
                  placeholder="jogo-de-panelas"
                  hint="Só letras minúsculas, números e hífen."
                  required
                  disabled={busy}
                />
                <Input
                  label="Nome"
                  value={giftForm.name}
                  onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                  placeholder="Jogo de Panelas"
                  required
                  disabled={busy}
                />
                <Input
                  label="Preço (R$)"
                  type="number"
                  min={0}
                  value={giftForm.priceCents}
                  onChange={(e) => setGiftForm({ ...giftForm, priceCents: e.target.value })}
                  placeholder="450"
                  required
                  disabled={busy}
                />
                <Input
                  label="Quantidade"
                  type="number"
                  min={1}
                  value={giftForm.quantity}
                  onChange={(e) => setGiftForm({ ...giftForm, quantity: e.target.value })}
                  hint="1 = item único; maior = cota."
                  disabled={busy}
                />
                <Textarea
                  label="Descrição"
                  value={giftForm.description}
                  onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                  rows={2}
                  disabled={busy}
                />
                <div className="admin__form-actions">
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Salvando…' : 'Criar presente'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card padding="var(--space-5)">
              <div className="admin__table-wrap">
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>Presente</th>
                      <th>Preço</th>
                      <th>Escolhido</th>
                      <th>Por quem</th>
                      <th>Situação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <tr key={gift.id}>
                        <td data-label="Presente">{gift.name}</td>
                        <td data-label="Preço">{brl.format(gift.priceCents / 100)}</td>
                        <td data-label="Escolhido">
                          {gift.claimedCount} / {gift.quantity}
                        </td>
                        <td data-label="Por quem">
                          {gift.claims.length === 0
                            ? '—'
                            : gift.claims.map((claim) => claim.displayName).join(', ')}
                        </td>
                        <td data-label="Situação">{gift.active ? 'Ativo' : 'Inativo'}</td>
                        <td data-label="Ações">
                          <div className="admin__actions">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () => adminApi.updateGift(gift.id, { active: !gift.active }),
                                  gift.active ? 'Presente desativado.' : 'Presente reativado.',
                                )
                              }
                            >
                              {gift.active ? 'Desativar' : 'Reativar'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void run(() => adminApi.deleteGift(gift.id), 'Presente excluído.')
                              }
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
