export default function HostAvatar({ act = 0, state = 'idle', eyes = true }) {
  return <div className={`tour-avatar av-facet${eyes ? ' eyes' : ''}`} data-act={act} data-state={state} aria-hidden="true">
    <div className="fx-d"><i className="f f1" /><i className="f f2" /><i className="f f3" /><i className="f f4" /><i className="x xh" /><i className="x xv" /><i className="fx-scan" /><i className="fx-sheen" /></div>
    <i className="fx-gem" /><span className="fx-eyes"><i /><i /></span>
  </div>
}
