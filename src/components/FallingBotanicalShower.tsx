const petals = [
  { className: 'blossom', left: '7%', delay: '0s', duration: '14s', sway: '36px' },
  { className: 'leaf', left: '19%', delay: '3s', duration: '17s', sway: '-30px' },
  { className: 'petal', left: '31%', delay: '6s', duration: '13s', sway: '26px' },
  { className: 'blossom', left: '45%', delay: '1.5s', duration: '16s', sway: '-34px' },
  { className: 'leaf', left: '59%', delay: '5s', duration: '18s', sway: '30px' },
  { className: 'petal', left: '73%', delay: '8s', duration: '14s', sway: '-25px' },
  { className: 'blossom', left: '87%', delay: '2s', duration: '15s', sway: '32px' },
];

function BotanicalShape({ type }: { type: string }) {
  if (type === 'blossom') {
    return (
      <svg viewBox="0 0 40 40">
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d="M20 20 C13 12 14 3 20 3 C26 3 27 12 20 20Z" fill="#ec4899" transform={`rotate(${angle} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="3.5" fill="#fde68a" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return <svg viewBox="0 0 36 36"><path d="M18 2C28 10 30 24 18 34 6 24 8 10 18 2Z" fill="#16a34a" /><path d="M18 5v26" stroke="#bbf7d0" strokeWidth="1.2" /></svg>;
  }
  return <svg viewBox="0 0 30 30"><path d="M15 2C24 6 27 18 15 28 3 18 6 6 15 2Z" fill="#ec4899" /></svg>;
}

export default function FallingBotanicalShower() {
  return (
    <div className="falling-botanicals" aria-hidden="true">
      {petals.map((petal, index) => (
        <span
          className={`falling-botanical ${petal.className}`}
          key={`${petal.className}-${index}`}
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            '--petal-sway': petal.sway,
          } as React.CSSProperties}
        >
          <BotanicalShape type={petal.className} />
        </span>
      ))}
    </div>
  );
}
