import { Monogram } from '../ds/index.js'

export function PageLoader({ label = 'Carregando…' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Monogram size={36} />
      <span className="page-loader__label">{label}</span>
    </div>
  )
}
