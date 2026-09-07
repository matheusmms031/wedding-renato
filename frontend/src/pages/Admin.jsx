import { Fragment, useCallback, useEffect, useState } from 'react'
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
  { id: 'pix', label: 'PIX' },
]

const EMPTY_GUEST = { username: '', displayName: '', password: '', role: 'guest' }
const EMPTY_GIFT = { slug: '', name: '', description: '', priceCents: '', quantity: '1' }
const EMPTY_PIX = { pixKey: '', pixReceiverName: '', pixReceiverCity: '' }

function fetchAll(signal) {
  return Promise.all([
    adminApi.getSummary({ signal }),
    adminApi.listRsvps({ signal }),
    adminApi.listGuests({ signal }),
    adminApi.listGifts({ signal }),
    adminApi.getSettings({ signal }),
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
  const [pixForm, setPixForm] = useState(EMPTY_PIX)
  const [editandoGiftId, setEditandoGiftId] = useState(null)
  const [giftEdit, setGiftEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resettingId, setResettingId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  const apply = useCallback(([summaryData, rsvpData, guestData, giftData, settingsData]) => {
    setSummary(summaryData)
    setRsvps(rsvpData.rsvps)
    setGuests(guestData.guests)
    setGifts(giftData.gifts)
    setPixForm(settingsData.settings)
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

  function abrirEdicaoGift(gift) {
    setEditandoGiftId(gift.id)
    // O preço vai para a tela em reais; o backend guarda em centavos.
    setGiftEdit({
      name: gift.name,
      description: gift.description,
      priceCents: String(gift.priceCents / 100),
      quantity: String(gift.quantity),
      sortOrder: String(gift.sortOrder),
    })
  }

  function fecharEdicaoGift() {
    setEditandoGiftId(null)
    setGiftEdit(null)
  }

  async function handleSalvarGift(event, giftId) {
    event.preventDefault()
    const ok = await run(
      () =>
        adminApi.updateGift(giftId, {
          name: giftEdit.name.trim(),
          description: giftEdit.description.trim(),
          priceCents: Math.round(Number(giftEdit.priceCents) * 100) || 0,
          quantity: Number(giftEdit.quantity) || 1,
          sortOrder: Number(giftEdit.sortOrder) || 0,
        }),
      'Presente atualizado.',
    )
    if (ok) fecharEdicaoGift()
  }

  async function handleSalvarPix(event) {
    event.preventDefault()
    await run(() => adminApi.updateSettings(pixForm), 'Configuração do PIX salva.')
  }

  async function handleEnviarImagem(giftId, file) {
    if (!file) return
    await run(() => adminApi.uploadGiftImage(giftId, file), 'Imagem enviada.')
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
    <main className="admin fade-in">
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
                      <th>Imagem</th>
                      <th>Escolhido</th>
                      <th>Por quem</th>
                      <th>Situação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <Fragment key={gift.id}>
                      <tr>
                        <td data-label="Presente">{gift.name}</td>
                        <td data-label="Preço">{brl.format(gift.priceCents / 100)}</td>
                        <td data-label="Imagem">
                          <div className="admin__imagem">
                            {gift.imageUrl && (
                              <img
                                className="admin__miniatura"
                                src={gift.imageUrl}
                                alt={gift.name}
                                loading="lazy"
                              />
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              disabled={busy}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                // Zera o input para permitir reenviar o mesmo arquivo.
                                e.target.value = ''
                                void handleEnviarImagem(gift.id, file)
                              }}
                            />
                          </div>
                        </td>
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
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                editandoGiftId === gift.id
                                  ? fecharEdicaoGift()
                                  : abrirEdicaoGift(gift)
                              }
                            >
                              {editandoGiftId === gift.id ? 'Fechar' : 'Editar'}
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

                      {editandoGiftId === gift.id && giftEdit && (
                        <tr className="admin__row-edit">
                          {/* colSpan cobre a tabela inteira: são cinco campos,
                              que não cabem espremidos na célula de ações. */}
                          <td colSpan={7}>
                            <form
                              className="admin__form admin__form--inline"
                              onSubmit={(e) => void handleSalvarGift(e, gift.id)}
                            >
                              <Input
                                label="Nome"
                                value={giftEdit.name}
                                onChange={(e) => setGiftEdit({ ...giftEdit, name: e.target.value })}
                                required
                              />
                              <Textarea
                                label="Descrição"
                                rows={2}
                                value={giftEdit.description}
                                onChange={(e) =>
                                  setGiftEdit({ ...giftEdit, description: e.target.value })
                                }
                              />
                              <Input
                                label="Preço (R$)"
                                type="number"
                                min="0"
                                step="0.01"
                                value={giftEdit.priceCents}
                                onChange={(e) =>
                                  setGiftEdit({ ...giftEdit, priceCents: e.target.value })
                                }
                                required
                              />
                              <Input
                                label="Quantidade"
                                type="number"
                                min="1"
                                value={giftEdit.quantity}
                                onChange={(e) =>
                                  setGiftEdit({ ...giftEdit, quantity: e.target.value })
                                }
                                required
                              />
                              {/* O backend recusa quantidade abaixo do que já foi
                                  escolhido; o aviso poupa a viagem. */}
                              {gift.claimedCount > 0 && (
                                <p className="admin__hint">
                                  Já escolhido {gift.claimedCount} vez(es) — a quantidade não pode
                                  ficar abaixo disso.
                                </p>
                              )}
                              <Input
                                label="Ordem de exibição"
                                type="number"
                                value={giftEdit.sortOrder}
                                onChange={(e) =>
                                  setGiftEdit({ ...giftEdit, sortOrder: e.target.value })
                                }
                              />

                              <div className="admin__actions">
                                <Button type="submit" size="sm" disabled={busy}>
                                  {busy ? 'Salvando…' : 'Salvar'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={fecharEdicaoGift}
                                  disabled={busy}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {tab === 'pix' && (
          <Card className="admin__card" padding="var(--space-6)">
            <h2 className="admin__card-title">Chave PIX dos presentes</h2>
            <p className="admin__hint">
              É esta chave que aparece no QR Code que o convidado vê ao escolher um presente. Sem
              ela preenchida, o QR não é gerado.
            </p>

            <form className="admin__form" onSubmit={handleSalvarPix}>
              <Input
                label="Chave PIX"
                value={pixForm.pixKey}
                onChange={(e) => setPixForm({ ...pixForm, pixKey: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
              <p className="admin__hint">
                CPF, CNPJ, e-mail, telefone ou chave aleatória. Pode digitar o CPF com pontos e
                traço: a pontuação é removida antes de entrar no QR, como o Banco Central exige.
              </p>

              <Input
                label="Nome do recebedor"
                value={pixForm.pixReceiverName}
                onChange={(e) => setPixForm({ ...pixForm, pixReceiverName: e.target.value })}
                maxLength={25}
                required
              />
              {/* Os limites abaixo são do padrão EMV do Bacen, não capricho:
                  passar deles gera um QR que o app do banco recusa. */}
              <p className="admin__hint">
                {pixForm.pixReceiverName.length}/25 caracteres — limite do padrão do Bacen.
              </p>

              <Input
                label="Cidade do recebedor"
                value={pixForm.pixReceiverCity}
                onChange={(e) => setPixForm({ ...pixForm, pixReceiverCity: e.target.value })}
                maxLength={15}
                required
              />
              <p className="admin__hint">
                {pixForm.pixReceiverCity.length}/15 caracteres — limite do padrão do Bacen.
              </p>

              <Button type="submit" disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </main>
  )
}
