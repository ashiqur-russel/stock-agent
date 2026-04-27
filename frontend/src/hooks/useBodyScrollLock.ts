import { useEffect } from 'react'

/** Lock document scroll while a modal / overlay is open; restores previous styles on cleanup. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingRight
    const sb = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (sb > 0) body.style.paddingRight = `${sb}px`
    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPadding
    }
  }, [active])
}
