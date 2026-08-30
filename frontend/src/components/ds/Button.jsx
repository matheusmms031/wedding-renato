export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  onClick,
  disabled,
}) {
  const className = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    block ? 'ds-button--block' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
