import { cn } from '../../utils/format.js';

export default function SectionHeading({ eyebrow, title, description, action, className, align = 'left' }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between', align === 'center' && 'items-center text-center md:flex-col md:items-center', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-3xl font-bold uppercase leading-[1.05] sm:text-4xl lg:text-[44px]">{title}</h2>
        {description && <p className="mt-3 text-base text-mist-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="relative overflow-hidden border-b border-white/5">
      <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" aria-hidden />
      <div className="absolute -top-40 left-1/3 h-80 w-[40rem] rounded-full bg-lime/[0.07] blur-3xl" aria-hidden />
      <div className="absolute -top-20 right-0 h-72 w-96 rounded-full bg-violet/10 blur-3xl" aria-hidden />
      <div className="container-page relative pb-10 pt-28 sm:pb-12 sm:pt-32">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl font-bold uppercase leading-none sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base text-mist-400 sm:text-lg">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}
