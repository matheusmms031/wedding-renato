import { useEffect, useRef, useState } from 'react'
import { claimGift, getGiftPix } from '../../api/gifts.js'
import { Button } from '../ds/index.js'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function GiftPixModal({ gift, onFechar, onConfirmado }) {
  const [pix, setPix] = useState(null)
  const [status, setStatus] = useState('carregando')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const dialogoRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    getGiftPix(gift.id, { signal: controller.signal })
      .then((dados) => {
        if (ignore) return
        setPix(dados)
        setStatus('pronto')
      })
      .catch((err) => {
        if (ignore || err.name === 'AbortError') return
        setErro(err.message)
        setStatus('pronto')
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [gift.id])

  // Esc fecha, e o foco começa dentro do diálogo para quem navega por teclado.
  useEffect(() => {
    dialogoRef.current?.focus()

    function aoTeclar(evento) {
      if (evento.key === 'Escape') onFechar()
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function copiar() {
    await navigator.clipboard.writeText(pix.payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function confirmar() {
    setConfirmando(true)
    setErro('')
    try {
      await claimGift(gift.id)
      await onConfirmado()
      onFechar()
    } catch (err) {
      // O presente pode ter sido escolhido enquanto esta pessoa pagava. O
      // dinheiro já saiu, então a mensagem precisa dizer o que fazer em vez
      // de só informar que falhou.
      setErro(
        err.code === 'GIFT_UNAVAILABLE'
          ? 'Outra pessoa escolheu este presente enquanto você pagava. Se o PIX já saiu, fale com os noivos que eles resolvem.'
          : err.message,
      )
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="modal__fundo" onClick={onFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Presentear: ${gift.name}`}
        tabIndex={-1}
        ref={dialogoRef}
        onClick={(evento) => evento.stopPropagation()}
      >
        <h3 className="modal__titulo">{gift.name}</h3>
        <p className="modal__valor">{brl.format(gift.priceCents / 100)}</p>

        {status === 'carregando' && (
          <p className="modal__nota" role="status">
            Gerando o código…
          </p>
        )}

        {status === 'pronto' && pix && (
          <>
            <p className="modal__nota">
              Aponte a câmera do app do seu banco, ou copie o código abaixo.
            </p>

            {/* SVG gerado pelo nosso backend a partir de dado nosso. */}
            <div
              className="modal__qr"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: pix.qrcodeSvg }}
            />

            <Button variant="secondary" size="sm" onClick={copiar}>
              {copiado ? 'Código copiado!' : 'Copiar código PIX'}
            </Button>
          </>
        )}

        {erro && (
          <p className="modal__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="modal__acoes">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={confirmando}>
            Cancelar
          </Button>
          {status === 'pronto' && pix && (
            <Button size="sm" onClick={confirmar} disabled={confirmando}>
              {confirmando ? 'Aguarde…' : 'Já fiz o PIX'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
