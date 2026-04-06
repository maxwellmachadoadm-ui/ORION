// OrionLogo — logo oficial ORION com constelação real e gradiente
// Constelação de Orion: Betelgeuse, Bellatrix, Alnitak, Alnilam, Mintaka, Saiph, Rigel

export function OrionLogo({ size = 36, showText = false }) {
  const id = `og-${size}`
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        {/* Fundo: azul profundo → azul elétrico */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="60%" stopColor="#0d2060" />
          <stop offset="100%" stopColor="#1a3faa" />
        </linearGradient>
        {/* Brilho radial interno */}
        <radialGradient id={`${id}-glow`} cx="55%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        {/* Brilho estelar Rigel */}
        <radialGradient id={`${id}-rigel`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Card */}
      <rect width="40" height="40" rx="9" fill={`url(#${id}-bg)`} />
      {/* Borda sutil azul elétrico */}
      <rect width="40" height="40" rx="9" stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.35" fill="none" />

      {/* Brilho radial */}
      <ellipse cx="22" cy="19" rx="19" ry="18" fill={`url(#${id}-glow)`} />

      {/* ── Linhas da constelação de Orion ── */}
      {/* Ombros: Betelgeuse(8,10) ↔ Bellatrix(27,11) */}
      <line x1="8" y1="10" x2="27" y2="11" stroke="#93c5fd" strokeWidth="0.55" strokeOpacity="0.35" />
      {/* Betelgeuse → Alnitak(11,19) */}
      <line x1="8" y1="10" x2="11" y2="19" stroke="#93c5fd" strokeWidth="0.55" strokeOpacity="0.3" />
      {/* Bellatrix → Mintaka(26,17) */}
      <line x1="27" y1="11" x2="26" y2="17" stroke="#93c5fd" strokeWidth="0.55" strokeOpacity="0.3" />
      {/* Cinturão: Alnitak(11,19) → Alnilam(19,17) → Mintaka(26,17) */}
      <line x1="11" y1="19" x2="19" y2="17" stroke="#93c5fd" strokeWidth="0.7" strokeOpacity="0.55" />
      <line x1="19" y1="17" x2="26" y2="17" stroke="#93c5fd" strokeWidth="0.7" strokeOpacity="0.55" />
      {/* Alnitak → Saiph(12,30) */}
      <line x1="11" y1="19" x2="12" y2="30" stroke="#93c5fd" strokeWidth="0.55" strokeOpacity="0.28" />
      {/* Mintaka → Rigel(29,29) */}
      <line x1="26" y1="17" x2="29" y2="29" stroke="#93c5fd" strokeWidth="0.55" strokeOpacity="0.28" />

      {/* ── Estrelas ── */}
      {/* Betelgeuse — ombro esquerdo, laranja-azulado */}
      <circle cx="8" cy="10" r="1.6" fill="#dbeafe" fillOpacity="0.92" />
      <circle cx="8" cy="10" r="2.8" fill="#93c5fd" fillOpacity="0.12" />

      {/* Bellatrix — ombro direito */}
      <circle cx="27" cy="11" r="1.3" fill="#bfdbfe" fillOpacity="0.85" />

      {/* Cinturão — 3 estrelas alinhadas */}
      <circle cx="11" cy="19" r="1.1" fill="#93c5fd" fillOpacity="0.9" />
      <circle cx="19" cy="17" r="1.2" fill="#93c5fd" fillOpacity="0.95" />
      <circle cx="26" cy="17" r="1.1" fill="#93c5fd" fillOpacity="0.9" />

      {/* Saiph — pé esquerdo */}
      <circle cx="12" cy="30" r="1.2" fill="#bfdbfe" fillOpacity="0.75" />

      {/* Rigel — pé direito, estrela mais brilhante */}
      <circle cx="29" cy="29" r="2.8" fill={`url(#${id}-rigel)`} fillOpacity="0.22" />
      <circle cx="29" cy="29" r="1.7" fill="#eff6ff" fillOpacity="0.98" />

      {/* Pequenas estrelas de fundo */}
      <circle cx="5"  cy="24" r="0.5" fill="white" fillOpacity="0.25" />
      <circle cx="33" cy="8"  r="0.5" fill="white" fillOpacity="0.22" />
      <circle cx="35" cy="22" r="0.4" fill="white" fillOpacity="0.18" />
      <circle cx="3"  cy="35" r="0.4" fill="white" fillOpacity="0.15" />
      <circle cx="22" cy="5"  r="0.5" fill="white" fillOpacity="0.2"  />

      {showText && (
        <text
          x="20" y="38"
          textAnchor="middle"
          fontFamily="Syne, sans-serif"
          fontWeight="900"
          fontSize="7"
          letterSpacing="2"
          fill="url(#orion-txt)"
        >
          ORION
        </text>
      )}
    </svg>
  )
}
