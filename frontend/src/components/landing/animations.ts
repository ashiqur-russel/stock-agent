/** Shared framer-motion variants for landing sections. */

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

/** Parent variant that staggers fadeUp children. */
export const staggerShow = (stagger: number) => ({
  show: { transition: { staggerChildren: stagger } },
})
