import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'

export function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  autoComplete = 'current-password',
  placeholder,
  name,
  disabled,
}) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId
  const toggleId = `${inputId}-toggle`

  const describedByValue = [describedBy, error ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="relative">
      <Input
        id={inputId}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedByValue || undefined}
        className="pr-11"
      />

      <button
        type="button"
        id={toggleId}
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={inputId}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/60 absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
      </button>
    </div>
  )
}

export default PasswordInput
