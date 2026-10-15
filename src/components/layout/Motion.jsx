import { motion } from 'framer-motion';

/** Fades/slides content in once as it scrolls into view. Honors reduced motion via MotionConfig. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }) {
  const Comp = motion[as];
  return (
    <Comp className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </Comp>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function PageTransition({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
