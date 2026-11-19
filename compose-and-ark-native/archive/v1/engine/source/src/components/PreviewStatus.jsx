// Reuse the topbar preview material for read-only simulation labels.
export function PreviewStatusContent({ children = 'demo · preview' }) {
  return <><span className="pm-toggle-preview-dot" aria-hidden="true" /><span className="pm-toggle-preview-text">{children}</span></>
}

export default function PreviewStatus({ children, compact = false }) {
  return <span className={`pm-toggle pm-toggle-preview pm-status-badge${compact ? ' pm-status-badge--compact' : ''}`}><PreviewStatusContent>{children}</PreviewStatusContent></span>
}
