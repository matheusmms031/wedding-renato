import { useId } from 'react'

export function Input({
  label,
  hint,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  min,
  name,
  disabled,
}) {
  const id = useId()
  const describedBy = error || hint ? `${id}-hint` : undefined

  return (
    <div className="ds-field">
      {label && (
        <label className="ds-field__label" htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <input
        id={id}
        name={name}
        className="ds-field__control"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        min={min}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />
      {(error || hint) && (
        <span
          id={describedBy}
          className={error ? 'ds-field__hint ds-field__hint--error' : 'ds-field__hint'}
        >
          {error || hint}
        </span>
      )}
    </div>
  )
}
