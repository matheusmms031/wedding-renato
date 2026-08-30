import { useId } from 'react'

export function Select({ label, hint, value, onChange, options = [], name, disabled }) {
  const id = useId()
  const describedBy = hint ? `${id}-hint` : undefined

  return (
    <div className="ds-field">
      {label && (
        <label className="ds-field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        className="ds-field__control ds-field__control--select"
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={describedBy}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <span id={describedBy} className="ds-field__hint">
          {hint}
        </span>
      )}
    </div>
  )
}
