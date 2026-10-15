import { motion } from 'framer-motion';
import { LogoMark } from '../../components/layout/Logo.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-16 pt-28">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute left-1/2 top-1/4 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-lime/10 blur-[110px]" aria-hidden />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <LogoMark className="mx-auto h-11 w-11" />
          <h1 className="mt-5 text-3xl font-bold uppercase">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-mist-400">{subtitle}</p>}
        </div>
        <div className="surface p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-mist-400">{footer}</div>}
      </motion.div>
    </section>
  );
}
