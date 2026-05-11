import { useEffect, useState } from "react";

const LINES = [
  { text: "const developer = {", indent: 0, color: "term-white" },
  { text: "  name: 'Umar',", indent: 0, color: "term-string" },
  {
    text: "  stack: ['React', 'Node', 'TypeScript'],",
    indent: 0,
    color: "term-string",
  },
  { text: "  focus: 'full-stack products',", indent: 0, color: "term-string" },
  { text: "  employed: true,", indent: 0, color: "term-accent" },
  { text: "}", indent: 0, color: "term-white" },
  { text: "", indent: 0, color: "term-white" },
  { text: "server.listen(4000, () => {", indent: 0, color: "term-white" },
  { text: "  console.log('Ready ✓')", indent: 0, color: "term-muted" },
  { text: "})", indent: 0, color: "term-white" },
];

const CHAR_SPEED = 28; // ms per character
const LINE_PAUSE = 120; // ms pause between lines
const RESTART_DELAY = 2800; // ms before restarting

function HeroTerminal() {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        setDisplayed([]);
        setCurrentLine(0);
        setCurrentChar(0);
        setDone(false);
      }, RESTART_DELAY);
      return () => clearTimeout(t);
    }

    if (currentLine >= LINES.length) {
      setDone(true);
      return;
    }

    const line = LINES[currentLine].text;

    if (currentChar < line.length) {
      const t = setTimeout(() => {
        setDisplayed((prev) => {
          const next = [...prev];
          next[currentLine] = (next[currentLine] ?? "") + line[currentChar];
          return next;
        });
        setCurrentChar((c) => c + 1);
      }, CHAR_SPEED);
      return () => clearTimeout(t);
    }

    // Line complete — move to next
    const t = setTimeout(() => {
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
    }, LINE_PAUSE);
    return () => clearTimeout(t);
  }, [currentLine, currentChar, done]);

  return (
    <div className="hero-terminal">
      {/* Title bar */}
      <div className="hero-terminal-bar">
        <span className="term-dot term-dot-red" />
        <span className="term-dot term-dot-yellow" />
        <span className="term-dot term-dot-green" />
        <span className="hero-terminal-title">portfolio.ts</span>
      </div>

      {/* Code area */}
      <div className="hero-terminal-body">
        {LINES.map((line, i) => (
          <div key={i} className="term-line">
            <span className="term-ln">{i + 1}</span>
            <span className={`term-code ${line.color}`}>
              {displayed[i] ?? ""}
              {i === currentLine && !done && <span className="term-cursor" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroTerminal;
