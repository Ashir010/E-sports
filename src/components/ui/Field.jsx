import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/format.js';

const inputBase =
  'w-full rounded-xl border bg-ink-850 px-3.5 text-sm text-mist-100 placeholder:text-mist-500 transition focus:outline-none focus:ring-2 focus:ring-lime/40 disabled:opacity-50';

function Wrapper({ id, label, error, hint, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-mist-300">
          {label}
          {required && <span className="ml-0.5 text-lime" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-mist-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describe = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);
const border = (error) => (error ? 'border-danger/60' : 'border-white/10 hover:border-white/20 focus:border-lime/50');

export const Input = forwardRef(function Input({ label, error, hint, className, icon: Icon, required, ...props }, ref) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" aria-hidden />}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describe(id, error, hint)}
          required={required}
          className={cn(inputBase, 'h-11', Icon && 'pl-9', border(error))}
          {...props}
        />
      </div>
    </Wrapper>
  );
});

export function Textarea({ label, error, hint, className, required, rows = 4, ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea id={id} rows={rows} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} className={cn(inputBase, 'py-2.5', border(error))} {...props} />
    </Wrapper>
  );
}

export function Select({ label, error, hint, className, options, required, ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select id={id} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} className={cn(inputBase, 'h-11 appearance-none pr-9', border(error))} {...props}>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-800">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" aria-hidden />
      </div>
    </Wrapper>
  );
}

export function Checkbox({ label, description, checked, onChange, id: idProp }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-ink-850 p-3 hover:border-white/20">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-lime" />
      <span>
        <span className="block text-sm text-mist-100">{label}</span>
        {description && <span className="block text-xs text-mist-500">{description}</span>}
      </span>
    </label>
  );
}
