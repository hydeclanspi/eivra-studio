import { Component } from 'react'

/**
 * 页面级错误边界：单个路由渲染崩溃时保住应用外壳，
 * 显示可读错误与堆栈，而不是留下整页空白。
 */
export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[Eivra] page render failed:', error, info)
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children

    return (
      <div className="page-shell page-content-wide">
        <div className="glow-card bg-white rounded-2xl border border-rose-200 p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-rose-400">Page Render Error</p>
          <h2 className="text-xl font-semibold text-stone-800 font-display mt-1">这个页面遇到了运行时错误</h2>
          <p className="text-sm text-stone-500 mt-2">
            应用其余部分不受影响。可以尝试重新加载；如果问题持续，请把下面的错误信息交给开发者。
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-stone-50 border border-stone-100 p-4 text-xs text-rose-700 whitespace-pre-wrap">
            {String(error?.stack || error?.message || error)}
            {info?.componentStack ? `\n${info.componentStack}` : ''}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-primary btn-hover mt-4">
            重新加载
          </button>
        </div>
      </div>
    )
  }
}
