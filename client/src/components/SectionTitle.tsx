type SectionTitleProps = {
  title: string
  eyebrow?: string
}

function SectionTitle({ title, eyebrow }: SectionTitleProps) {
  return (
    <header className="section-title">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
    </header>
  )
}

export default SectionTitle
