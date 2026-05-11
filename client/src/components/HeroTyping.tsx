import { useEffect, useState } from "react";

type HeroTypingProps = {
  text: string;
};

const TYPING_SPEED = 40;

function HeroTyping({ text }: HeroTypingProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    setDisplayText("");
    setCurrentChar(0);
  }, [text]);

  useEffect(() => {
    if (currentChar > text.length) {
      return;
    }

    const handle = window.setTimeout(() => {
      setDisplayText(text.slice(0, currentChar + 1));
      setCurrentChar((value) => value + 1);
    }, TYPING_SPEED);

    return () => window.clearTimeout(handle);
  }, [currentChar, text]);

  return (
    <p className="hero-typing" aria-live="polite">
      <span className="hero-typing-text">{displayText}</span>
      <span className="hero-typing-cursor" aria-hidden="true" />
    </p>
  );
}

export default HeroTyping;
