import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Monogram } from '../ds/index.js'
import { useAuth } from '../../auth/auth-context.js'

const LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#nossa-historia', label: 'Nossa História' },
  { href: '#proposito', label: 'Propósito' },
  { href: '#local', label: 'Local' },
  { href: '#presentes', label: 'Presentes' },
  { href: '#rsvp', label: 'RSVP' },
]

export function SiteNavBar({ active }) {
  const { user, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Esc fecha o menu — o botão de abrir some do alcance do teclado quando o
  // painel cobre a tela em telas pequenas.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <nav className="site-nav" aria-label="Navegação principal">
      <div className="site-nav__bar">
        <a href="#inicio" aria-label="Início" onClick={close}>
          <Monogram size={24} />
        </a>

        {/* Rótulo em palavra, não ícone: o design system não tem iconografia,
            e "MENU" em Oswald é a mesma linguagem dos outros rótulos. */}
        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Fechar' : 'Menu'}
        </button>
      </div>

      {/* display:contents no desktop — os dois blocos viram itens diretos da
          barra; no mobile o mesmo nó vira o painel que abre. Sem markup duplicado. */}
      <div className="site-nav__collapse" id="menu-principal" data-open={open}>
        <div className="site-nav__links">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="site-nav__link"
              href={link.href}
              aria-current={link.label === active ? 'true' : undefined}
              onClick={close}
            >
              {link.label}
            </a>
          ))}
          {isAdmin && (
            <Link className="site-nav__link" to="/admin" onClick={close}>
              Painel
            </Link>
          )}
        </div>

        <div className="site-nav__account">
          {user && <span className="site-nav__guest">{user.displayName ?? user.username}</span>}
          {/* Handler async cru em onClick vira unhandled rejection se o logout falhar. */}
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}
