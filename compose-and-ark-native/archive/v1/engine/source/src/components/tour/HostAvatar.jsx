import { useId } from 'react'

// Original whale drawing: rounded silhouette inspired by the researched whale
// reference, with Eivra's pearl facets, champagne edge and small diamond heart.
export default function HostAvatar({ act = 0, state = 'idle', eyes = true }) {
  const id = useId().replaceAll(':', '')
  const paint = (name) => `url(#${id}-${name})`
  return <div className="tour-avatar av-whale" data-act={act} data-state={state} aria-hidden="true">
    <svg viewBox="0 0 144 100" fill="none">
      <defs>
        <linearGradient id={`${id}-body`} x1="37" y1="23" x2="87" y2="85" gradientUnits="userSpaceOnUse"><stop stopColor="#fffef8" /><stop offset=".42" stopColor="#eef5fa" /><stop offset=".73" stopColor="#cbdce8" /><stop offset="1" stopColor="#b3c4cf" /></linearGradient>
        <linearGradient id={`${id}-pearl`} x1="33" y1="53" x2="57" y2="81" gradientUnits="userSpaceOnUse"><stop stopColor="#fffdf6" /><stop offset="1" stopColor="#e9dfc7" /></linearGradient>
        <linearGradient id={`${id}-tail`} x1="103" y1="32" x2="125" y2="65" gradientUnits="userSpaceOnUse"><stop stopColor="#fffdf1" /><stop offset=".5" stopColor="#dceaf4" /><stop offset="1" stopColor="#acc8db" /></linearGradient>
        <linearGradient id={`${id}-gold`} x1="59" y1="41" x2="70" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#fff7da" /><stop offset=".55" stopColor="#e6cf8f" /><stop offset="1" stopColor="#b49a55" /></linearGradient>
      </defs>
      <ellipse className="whale-shadow" cx="69" cy="86" rx="34" ry="3" fill="#9faebc" opacity=".16" />
      <g className="whale-swimmer">
        <g className="whale-tail"><path d="M93 57C101 52 104 44 102 34C109 33 114 37 116 43C119 36 126 32 133 34C132 44 126 50 117 53C114 61 108 66 98 67Z" fill={paint('tail')} stroke="#cbbd97" strokeWidth=".9" strokeLinejoin="round" /><path d="M105 39Q114 45 116 51Q123 42 129 38" stroke="white" strokeOpacity=".85" strokeWidth="1.2" /></g>
        <path d="M105 55C95 55 88 48 82 40C73 28 58 25 44 27C25 28 13 38 12 52C10 67 24 76 44 78C70 81 96 71 105 55Z" fill={paint('body')} stroke="#c9ba95" strokeWidth=".95" strokeLinejoin="round" />
        <path d="M13 53C24 65 46 68 64 65C78 63 89 61 100 59C88 73 65 80 43 77C26 75 13 68 13 53Z" fill={paint('pearl')} />
        <path d="M17 43C26 32 41 29 54 30" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
        <path d="M48 28L64 48L83 41M64 48L82 68M64 48L39 68" stroke="white" strokeOpacity=".5" strokeWidth=".8" />
        <path className="whale-fin" d="M58 62C61 73 72 79 81 72C74 71 69 65 67 59" fill={paint('tail')} stroke="#afc4d0" strokeWidth=".8" strokeLinejoin="round" />
        <g className="whale-heart"><path d="M64 40L71 48L64 56L57 48Z" fill={paint('gold')} stroke="#fbf7e9" strokeWidth="1" /><path d="M64 42V54M59 48H69" stroke="#fffdf3" strokeWidth=".75" opacity=".8" /><circle cx="64" cy="48" r="1.8" fill="#c9a227" /></g>
        {eyes && <g className="whale-face">
          <g className="whale-eye"><ellipse cx="32" cy="51" rx="3.1" ry="3.8" fill="#344c60" /><circle cx="31" cy="49.7" r="1" fill="white" /></g>
          <ellipse cx="23" cy="57.5" rx="4" ry="2" fill="#d7b8a0" opacity=".4" />
          <path className="whale-smile" d="M25 60Q30 65 36 60" stroke="#5c7281" strokeWidth="1.3" strokeLinecap="round" />
        </g>}
      </g>
      <g className="whale-bubbles" stroke="#b7ccdc" fill="#f6fbff"><circle cx="47" cy="16" r="3" /><circle cx="56" cy="9" r="1.7" /></g>
    </svg>
  </div>
}
