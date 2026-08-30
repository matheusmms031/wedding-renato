import { useId } from 'react'

export function Textarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
  name,
  disabled,
  maxLength,
}) {
  const id = useId()
  const describedBy = hint ? `${id}-hint` : undefined

  return (
    <div className="ds-field">
      {label && (
        <label className="ds-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        className="ds-field__control ds-field__control--boxed"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        aria-describedby={describedBy}
      />
      {hint && (
        <span id={describedBy} className="ds-field__hint">
          {hint}
        </span>
      )}
    </div>
  )
}
