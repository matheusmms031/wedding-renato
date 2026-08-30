export function Card({ children, padding = 'var(--space-6)', className = '' }) {
  return (
    <div className={`ds-card ${className}`.trim()} style={{ padding }}>
      {children}
    </div>
  )
}
