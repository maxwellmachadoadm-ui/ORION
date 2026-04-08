export function OrionLogo({ size = 32 }) {
  const id = `ol-${size}`
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d1f3c" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id}-bg)`} />
      <rect width="32" height="32" rx="8" stroke="rgba(59,130,246,0.3)" strokeWidth="0.6" fill="none" />
      <line x1="7" y1="9" x2="23" y2="9" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.6" />
      <line x1="7" y1="9" x2="10" y2="17" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.5" />
      <line x1="23" y1="9" x2="22" y2="17" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.5" />
      <line x1="10" y1="17" x2="16" y2="16" stroke="#60a5fa" strokeWidth="0.6" strokeOpacity="0.8" />
      <line x1="16" y1="16" x2="22" y2="17" stroke="#60a5fa" strokeWidth="0.6" strokeOpacity="0.8" />
      <line x1="10" y1="17" x2="10" y2="26" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.4" />
      <line x1="22" y1="17" x2="24" y2="26" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.4" />
      <circle cx="7" cy="9" r="1.5" fill="#93c5fd" />
      <circle cx="23" cy="9" r="1.2" fill="#60a5fa" />
      <circle cx="10" cy="17" r="1.1" fill="#93c5fd" />
      <circle cx="16" cy="16" r="1.3" fill="#e0f2fe" />
      <circle cx="22" cy="17" r="1.1" fill="#93c5fd" />
      <circle cx="24" cy="26" r="1.6" fill="#dbeafe" />
      <circle cx="24" cy="26" r="0.7" fill="#fff" />
      <circle cx="10" cy="26" r="1.0" fill="#60a5fa" />
      <circle cx="3" cy="4" r="0.3" fill="white" fillOpacity="0.3" />
      <circle cx="28" cy="5" r="0.3" fill="white" fillOpacity="0.25" />
      <circle cx="29" cy="20" r="0.3" fill="white" fillOpacity="0.2" />
      <circle cx="4" cy="28" r="0.3" fill="white" fillOpacity="0.2" />
    </svg>
  )
}
