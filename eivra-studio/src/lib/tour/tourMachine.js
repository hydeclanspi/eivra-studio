import { STEPS, TRACKS } from './tourScript'

export const initialTourState = { status: 'idle', track: 'full', index: 0, phase: 'routing', remaining: null, epoch: 0 }
export const stepId = (state) => TRACKS[state.track][state.index]
export function tourReducer(state, event) {
  const move = (index) => index >= TRACKS[state.track].length
    ? { ...state, status: 'finale', remaining: 0 }
    : { ...state, status: 'running', index: Math.max(0, index), phase: 'routing', remaining: null, epoch: state.epoch + 1 }
  switch (event.type) {
    case 'OFFER': return state.status === 'idle' ? { ...state, status: 'offered', track: event.track || 'full' } : state
    case 'START': return { ...initialTourState, status: 'running', track: event.track in TRACKS ? event.track : 'full', epoch: state.epoch + 1 }
    case 'RESTORE': {
      const track = event.record.track in TRACKS ? event.record.track : 'full'
      const index = TRACKS[track].indexOf(event.record.stepId)
      if (index < 0) return state
      return { ...state, status: 'paused', track, index, remaining: Number.isFinite(event.record.remaining) ? Math.max(0, Math.min(STEPS[TRACKS[track][index]].duration, event.record.remaining)) : null }
    }
    case 'PHASE': return state.status === 'running' ? { ...state, phase: event.phase, ...(event.remaining == null ? {} : { remaining: event.remaining }) } : state
    case 'TICK': return state.status === 'running' && state.phase === 'dwelling' ? { ...state, remaining: Math.max(0, state.remaining - event.delta) } : state
    case 'PAUSE': case 'TAKE_OVER': case 'TAB_HIDDEN': case 'ROUTE_EXTERNAL':
      return state.status === 'running' ? { ...state, status: 'paused' } : state
    case 'RESUME': return state.status === 'paused' ? { ...state, status: 'running', phase: 'routing', epoch: state.epoch + 1 } : state
    case 'NEXT': return ['running', 'paused'].includes(state.status) ? move(state.index + 1) : state
    case 'PREV': return ['running', 'paused'].includes(state.status) ? move(state.index - 1) : state
    case 'EXIT': case 'DISMISS': return { ...state, status: 'done' }
    case 'DISABLE': return { ...initialTourState, epoch: state.epoch + 1 }
    default: return state
  }
}
