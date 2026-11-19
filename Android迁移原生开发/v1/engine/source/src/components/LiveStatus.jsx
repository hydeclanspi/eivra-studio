// Shared Live capsule content for the topbar and read-only status labels.
export function LiveStatusContent({ children = 'Live' }) {
  return <><span className="pm-toggle-live-dot" aria-hidden="true" /><span className="pm-toggle-live-text">{children}</span></>
}

export default function LiveStatus({ children, label }) {
  return <span className="pm-toggle pm-toggle-full pm-status-badge" aria-label={label}><LiveStatusContent>{children}</LiveStatusContent></span>
}
