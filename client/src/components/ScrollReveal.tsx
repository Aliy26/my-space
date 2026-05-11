import { useEffect, useRef, type ReactNode } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  variant?: 'up' | 'left' | 'right' | 'scale'
  delay?: number   // extra base delay in ms
}

function ScrollReveal({
  children,
  className = '',
  variant = 'up',
  delay = 0,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    // Apply base delay as CSS variable
    if (delay > 0) {
      node.style.setProperty('--reveal-base-delay', `${delay}ms`)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add('is-visible')
          observer.disconnect()
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={containerRef}
      className={`reveal-stage reveal-${variant} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default ScrollReveal
