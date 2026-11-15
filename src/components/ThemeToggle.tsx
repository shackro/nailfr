import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Moon, Sun } from 'lucide-react';

type ThemeToggleProps = {
  dark: boolean;
  onToggle: () => void;
};

type SweepOrigin = { x: number; y: number; radius: number };

export default function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [sweep, setSweep] = useState<SweepOrigin | null>(null);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const toggle = () => {
    if (sweep) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onToggle();
      return;
    }

    const bounds = buttonRef.current?.getBoundingClientRect();
    if (!bounds) {
      onToggle();
      return;
    }

    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y),
    );
    setSweep({ x, y, radius });

    timers.current = [
      window.setTimeout(onToggle, 440),
      window.setTimeout(() => setSweep(null), 820),
    ];
  };

  const sweepStyle = sweep ? {
    '--eclipse-x': `${sweep.x}px`,
    '--eclipse-y': `${sweep.y}px`,
    '--eclipse-radius': `${sweep.radius}px`,
  } as CSSProperties : undefined;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`icon-button theme-toggle${dark ? ' is-dark' : ''}`}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={dark}
        onClick={toggle}
        disabled={Boolean(sweep)}
      >
        <span className="theme-icon-spin" key={dark ? 'dark' : 'light'}>
          {dark ? <Sun /> : <Moon />}
        </span>
      </button>
      {sweep && (
        <div
          className={`theme-eclipse${dark ? ' to-light' : ' to-dark'}`}
          style={sweepStyle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
