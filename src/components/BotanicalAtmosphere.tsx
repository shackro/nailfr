export default function BotanicalAtmosphere() {
  return (
    <svg
      className="botanical-atmosphere"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="botanical-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--rose)" stopOpacity=".05" />
          <stop offset=".55" stopColor="var(--rose)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--rose-soft)" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <path className="botanical-vine botanical-vine-left" pathLength="1" d="M2 -4 C15 18 2 31 9 49 S16 75 1 104" />
      <path className="botanical-vine botanical-vine-right" pathLength="1" d="M98 -4 C84 18 99 35 91 53 S83 79 99 104" />
      <g className="botanical-petal botanical-petal-one">
        <path d="M18 28 C7 20 9 12 20 17 C26 8 33 16 24 27 C22 29 20 29 18 28Z" />
      </g>
      <g className="botanical-petal botanical-petal-two">
        <path d="M80 53 C70 45 73 37 83 42 C90 34 96 42 86 52 C84 54 82 54 80 53Z" />
      </g>
      <g className="botanical-petal botanical-petal-three">
        <path d="M13 78 C4 71 7 63 16 68 C23 60 29 68 20 77 C18 79 15 79 13 78Z" />
      </g>
    </svg>
  );
}
