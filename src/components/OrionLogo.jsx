/**
 * OrionLogo — logo oficial ORION
 * Constelação real de Órion: Betelgeuse, Bellatrix, Alnitak, Alnilam, Mintaka, Saiph, Rigel
 * Gradiente azul profundo → elétrico, brilho radial, campo estelar.
 */
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
        {/* Fundo: azul noturno profundo */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#060f26" />
          <stop offset="55%" stopColor="#0c1e52" />
          <stop offset="100%" stopColor="#162d8c" />
        </linearGradient>

        {/* Brilho radial central — glow azul elétrico */}
        <radialGradient id={`${id}-glow`} cx="52%" cy="46%" r="52%">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.40" />
          <stop offset="50%"  stopColor="#1d4ed8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>

        {/* Glow Rigel — supergigante azul */}
        <radialGradient id={`${id}-rigel`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#dbeafe" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="#60a5fa" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>

        {/* Glow Betelgeuse — gigante */}
        <radialGradient id={`${id}-betel`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fef3c7" stopOpacity="0.80" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>

        {/* Gradiente estrelas cintura */}
        <linearGradient id={`${id}-belt`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#93c5fd" />
          <stop offset="50%"  stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>

        {/* Blur suave para halos */}
        <filter id={`${id}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={`${id}-blur-sm`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </defs>

      {/* Fundo arredondado */}
      <rect width="40" height="40" rx="9" fill={`url(#${id}-bg)`} />
      {/* Borda azul elétrico sutil */}
      <rect width="40" height="40" rx="9" stroke="#3b82f6" strokeWidth="0.7" strokeOpacity="0.30" fill="none" />

      {/* Brilho radial interno */}
      <ellipse cx="21" cy="19" rx="18" ry="17" fill={`url(#${id}-glow)`} />

      {/* ── LINHAS DA CONSTELAÇÃO ── */}
      {/* Ombros */}
      <line x1="8" y1="10" x2="27" y2="11" stroke="#60a5fa" strokeWidth="0.5" strokeOpacity="0.40" />
      {/* Corpo esquerdo */}
      <line x1="8"  y1="10" x2="11" y2="19" stroke="#60a5fa" strokeWidth="0.45" strokeOpacity="0.32" />
      {/* Corpo direito */}
      <line x1="27" y1="11" x2="26" y2="17" stroke="#60a5fa" strokeWidth="0.45" strokeOpacity="0.32" />
      {/* Cinturão — mais brilhante */}
      <line x1="11" y1="19" x2="19" y2="17" stroke="#93c5fd" strokeWidth="0.65" strokeOpacity="0.65" />
      <line x1="19" y1="17" x2="26" y2="17" stroke="#93c5fd" strokeWidth="0.65" strokeOpacity="0.65" />
      {/* Pernas */}
      <line x1="11" y1="19" x2="12" y2="30" stroke="#60a5fa" strokeWidth="0.45" strokeOpacity="0.30" />
      <line x1="26" y1="17" x2="29" y2="29" stroke="#60a5fa" strokeWidth="0.45" strokeOpacity="0.30" />
      {/* Pés */}
      <line x1="12" y1="30" x2="29" y2="29" stroke="#60a5fa" strokeWidth="0.4" strokeOpacity="0.22" />

      {/* ── HALOS (glow atrás das estrelas) ── */}
      <circle cx="8"  cy="10" r="3.5" fill={`url(#${id}-betel)`} filter={`url(#${id}-blur)`} />
      <circle cx="29" cy="29" r="4.0" fill={`url(#${id}-rigel)`} filter={`url(#${id}-blur)`} />
      <circle cx="19" cy="17" r="2.5" fill="#60a5fa" fillOpacity="0.18" filter={`url(#${id}-blur-sm)`} />

      {/* ── ESTRELAS ── */}
      {/* Betelgeuse — ombro esquerdo, gigante */}
      <circle cx="8" cy="10" r="1.65" fill="#fef9c3" fillOpacity="0.95" />
      <circle cx="8" cy="10" r="0.80" fill="#ffffff" />

      {/* Bellatrix — ombro direito */}
      <circle cx="27" cy="11" r="1.30" fill="#bfdbfe" fillOpacity="0.90" />
      <circle cx="27" cy="11" r="0.60" fill="#ffffff" />

      {/* Alnitak — cintura esquerda */}
      <circle cx="11" cy="19" r="1.15" fill={`url(#${id}-belt)`} fillOpacity="0.95" />
      <circle cx="11" cy="19" r="0.55" fill="#ffffff" />

      {/* Alnilam — cintura central, maior */}
      <circle cx="19" cy="17" r="1.30" fill={`url(#${id}-belt)`} />
      <circle cx="19" cy="17" r="0.65" fill="#ffffff" />

      {/* Mintaka — cintura direita */}
      <circle cx="26" cy="17" r="1.15" fill={`url(#${id}-belt)`} fillOpacity="0.95" />
      <circle cx="26" cy="17" r="0.55" fill="#ffffff" />

      {/* Saiph — pé esquerdo */}
      <circle cx="12" cy="30" r="1.20" fill="#bfdbfe" fillOpacity="0.80" />
      <circle cx="12" cy="30" r="0.55" fill="#e0f2fe" />

      {/* Rigel — pé direito, supergigante azul, mais brilhante */}
      <circle cx="29" cy="29" r="2.20" fill={`url(#${id}-rigel)`} />
      <circle cx="29" cy="29" r="1.55" fill="#dbeafe" fillOpacity="0.98" />
      <circle cx="29" cy="29" r="0.75" fill="#ffffff" />

      {/* ── CAMPO ESTELAR (estrelas de fundo) ── */}
      <circle cx="4"  cy="4"  r="0.40" fill="white" fillOpacity="0.28" />
      <circle cx="16" cy="5"  r="0.35" fill="white" fillOpacity="0.22" />
      <circle cx="33" cy="7"  r="0.40" fill="white" fillOpacity="0.24" />
      <circle cx="5"  cy="22" r="0.35" fill="white" fillOpacity="0.18" />
      <circle cx="35" cy="15" r="0.40" fill="white" fillOpacity="0.22" />
      <circle cx="37" cy="28" r="0.35" fill="white" fillOpacity="0.18" />
      <circle cx="7"  cy="35" r="0.35" fill="white" fillOpacity="0.16" />
      <circle cx="22" cy="36" r="0.40" fill="white" fillOpacity="0.20" />
      <circle cx="33" cy="33" r="0.40" fill="white" fillOpacity="0.22" />
      <circle cx="3"  cy="28" r="0.35" fill="white" fillOpacity="0.15" />

      {showText && (
        <>
          <defs>
            <linearGradient id={`${id}-txt`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ffffff" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
          <text x="20" y="38" textAnchor="middle"
            fontFamily="Syne, sans-serif" fontWeight="900"
            fontSize="7" letterSpacing="2"
            fill={`url(#${id}-txt)`}>
            ORION
          </text>
        </>
      )}
    </svg>
  )
}
