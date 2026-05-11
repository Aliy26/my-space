import type { CSSProperties } from 'react'

type BackgroundEffectProps = {
  theme: 'dark' | 'light'
}

const backgroundParticles = [
  { x: '8%', y: '12%', size: '6px', delay: '0s', duration: '9s' },
  { x: '15%', y: '68%', size: '10px', delay: '1.5s', duration: '11s' },
  { x: '26%', y: '36%', size: '8px', delay: '2.2s', duration: '10.5s' },
  { x: '39%', y: '82%', size: '12px', delay: '0.7s', duration: '12s' },
  { x: '52%', y: '18%', size: '7px', delay: '2.6s', duration: '8.8s' },
  { x: '64%', y: '58%', size: '11px', delay: '1.1s', duration: '10.1s' },
  { x: '74%', y: '24%', size: '9px', delay: '3.2s', duration: '11.6s' },
  { x: '84%', y: '74%', size: '8px', delay: '2.8s', duration: '9.3s' },
  { x: '92%', y: '38%', size: '6px', delay: '1.8s', duration: '8.4s' },
]

function BackgroundEffect({ theme }: BackgroundEffectProps) {
  return (
    <div aria-hidden="true" className={`background-effect background-effect-${theme}`}>
      <div className="background-cursor-glow" />
      <div className="background-grid" />
      <div className="background-mesh" />
      <div className="background-ambient background-ambient-one" />
      <div className="background-ambient background-ambient-two" />
      <div className="background-ambient background-ambient-three" />
      <div className="background-ambient background-ambient-four" />
      <div className="background-ambient background-ambient-five" />
      <div className="background-ring" />
      <div className="background-particles">
        {backgroundParticles.map((particle, index) => (
          <span
            key={index}
            className="background-particle"
            style={
              {
                '--x': particle.x,
                '--y': particle.y,
                '--size': particle.size,
                '--delay': particle.delay,
                '--duration': particle.duration,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

export default BackgroundEffect
