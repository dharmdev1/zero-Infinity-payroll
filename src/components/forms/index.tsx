import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const INPUT_BASE =
  'h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-[13px] text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:bg-canvas disabled:text-muted'

export function Label({ htmlFor, children, required }: { htmlFor?: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
      {children}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
  )
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-danger">
      {children}
    </p>
  )
}

export function Hint({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mt-1.5 text-xs text-muted">
      {children}
    </p>
  )
}

interface FieldWrapperProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  /** Explicit control id from the caller; wins over the generated one so label ↔ control stay in sync. */
  labelFor?: string
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode
}

/** Shared label/error/hint wiring for accessible form fields. */
export function Field({ label, required, error, hint, className, labelFor, children }: FieldWrapperProps) {
  const id = useId()
  const inputId = labelFor ?? `${id}-input`
  const errId = `${id}-err`
  const hintId = `${id}-hint`
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('min-w-0', className)}>
      <Label htmlFor={inputId} required={required}>
        {label}
      </Label>
      {children({ inputId, describedBy })}
      <FieldError id={errId}>{error}</FieldError>
      {!error && hint ? <Hint id={hintId}>{hint}</Hint> : null}
    </div>
  )
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  wrapClassName?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, required, error, hint, wrapClassName, className, ...rest },
  ref,
) {
  if (!label) {
    return <input ref={ref} className={cn(INPUT_BASE, error ? 'border-danger' : 'border-line', className)} aria-invalid={!!error} {...rest} />
  }
  return (
    <Field label={label} required={required} error={error} hint={hint} className={wrapClassName} labelFor={rest.id}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={cn(INPUT_BASE, error ? 'border-danger' : 'border-line', className)}
          {...rest}
        />
      )}
    </Field>
  )
})

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
  wrapClassName?: string
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { label, required, error, hint, options, placeholder, wrapClassName, className, ...rest },
  ref,
) {
  const control = ({ inputId, describedBy }: { inputId: string; describedBy: string | undefined }) => (
    <div className="relative">
      <select
        ref={ref}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={cn(INPUT_BASE, 'appearance-none pr-9', error ? 'border-danger' : 'border-line', className)}
        {...rest}
      >
        {placeholder ? <option value="" disabled={required}>{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  )
  if (!label) {
    return control({ inputId: rest.id ?? '', describedBy: undefined })
  }
  return <Field label={label} required={required} error={error} hint={hint} className={wrapClassName} labelFor={rest.id}>{control}</Field>
})

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  wrapClassName?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, required, error, hint, wrapClassName, className, ...rest },
  ref,
) {
  const control = ({ inputId, describedBy }: { inputId: string; describedBy: string | undefined }) => (
    <textarea
      ref={ref}
      id={inputId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      className={cn(INPUT_BASE, 'h-auto min-h-[92px] py-2 leading-relaxed', error ? 'border-danger' : 'border-line', className)}
      {...rest}
    />
  )
  if (!label) return control({ inputId: rest.id ?? '', describedBy: undefined })
  return <Field label={label} required={required} error={error} hint={hint} className={wrapClassName} labelFor={rest.id}>{control}</Field>
})
