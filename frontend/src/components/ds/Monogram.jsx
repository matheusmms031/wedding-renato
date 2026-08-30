export function Monogram({ size = 40, inverted = false }) {
  return (
    <span
      className={inverted ? 'ds-monogram ds-monogram--inverted' : 'ds-monogram'}
      style={{ '--ds-monogram-size': `${size}px` }}
      aria-label="Renato e Marília"
      role="img"
    >
      <span className="ds-monogram__letter" aria-hidden="true">
        R
      </span>
      <span className="ds-monogram__amp" aria-hidden="true">
        &amp;
      </span>
      <span className="ds-monogram__letter" aria-hidden="true">
        M
      </span>
    </span>
  )
}
