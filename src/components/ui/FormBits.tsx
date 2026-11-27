import { Eye, EyeOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label-mono text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function PasswordInput({ value, onChange, autoComplete, minLength }: { value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative block">
      <input type={show ? 'text' : 'password'} required minLength={minLength} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="field-input pr-12" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-navy">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  )
}
