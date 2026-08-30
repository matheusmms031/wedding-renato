export function ScriptHeading({ children, size = 'md', as: Tag = 'span', color }) {
  return (
    <Tag className={`ds-script ds-script--${size}`} style={color ? { color } : undefined}>
      {children}
    </Tag>
  )
}
