const ROW_ONE = [
  { label: 'React',        icon: '⚛️' },
  { label: 'TypeScript',   icon: '🔷' },
  { label: 'Node.js',      icon: '🟢' },
  { label: 'Express',      icon: '🚂' },
  { label: 'MongoDB',      icon: '🍃' },
  { label: 'REST API',     icon: '🔗' },
  { label: 'Docker',       icon: '🐳' },
  { label: 'PostgreSQL',   icon: '🐘' },
  { label: 'Git',          icon: '🌿' },
  { label: 'Vite',         icon: '⚡' },
]

const ROW_TWO = [
  { label: 'JWT Auth',     icon: '🔐' },
  { label: 'WebSockets',   icon: '🔌' },
  { label: 'Linux',        icon: '🐧' },
  { label: 'Tailwind CSS', icon: '🎨' },
  { label: 'Figma',        icon: '✏️' },
  { label: 'CI/CD',        icon: '♾️' },
  { label: 'Mongoose',     icon: '🗄️' },
  { label: 'Nginx',        icon: '🌐' },
  { label: 'Cloudflare',   icon: '☁️' },
  { label: 'OpenAI API',   icon: '🤖' },
]

type TickerItem = { label: string; icon: string }

function TickerRow({ items, reverse = false }: { items: TickerItem[]; reverse?: boolean }) {
  const doubled = [...items, ...items]

  return (
    <div className={`ticker-row ${reverse ? 'ticker-row-reverse' : ''}`}>
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-icon" aria-hidden="true">{item.icon}</span>
            <span className="ticker-label">{item.label}</span>
            <span className="ticker-dot" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  )
}

function TechTicker() {
  return (
    <div className="tech-ticker" aria-hidden="true">
      <TickerRow items={ROW_ONE} />
      <TickerRow items={ROW_TWO} reverse />
    </div>
  )
}

export default TechTicker
