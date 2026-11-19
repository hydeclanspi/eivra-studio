import { describe, expect, it, vi } from 'vitest'
import { attachGlassMaterialMotion } from '../glassMaterialMotion'

const element = (classes, parentElement = null, tagName = 'div') => {
  const attributes = new Map()
  const properties = new Map()
  const node = {
    parentElement, tagName, isConnected: true,
    style: {
      setProperty: (key, value) => properties.set(key, value),
      removeProperty: (key) => properties.delete(key),
    },
    properties, attributes,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: (key) => attributes.delete(key),
    matches: (selector) => selector.split(',').some((part) => {
      const value = part.trim()
      if (value.startsWith('.')) return classes.split(' ').includes(value.slice(1))
      if (value === '[role="dialog"]') return attributes.get('role') === 'dialog'
      return value === tagName
    }),
    closest: (selector) => {
      for (let current = node; current; current = current.parentElement) {
        if (current.matches(selector)) return current
      }
      return null
    },
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 })),
  }
  return node
}

const setup = (initialReduction) => {
  const page = Object.assign(new EventTarget(), { hidden: false, querySelectorAll: vi.fn(() => { throw new Error('Global card scan') }) })
  const preferences = new Map()
  const frames = new Map()
  let frameId = 0
  const host = Object.assign(new EventTarget(), {
    matchMedia: (query) => {
      const item = Object.assign(new EventTarget(), { matches: query === initialReduction })
      preferences.set(query, item)
      return item
    },
    requestAnimationFrame: vi.fn((callback) => { frames.set(++frameId, callback); return frameId }),
    cancelAnimationFrame: vi.fn((id) => frames.delete(id)),
  })
  const scope = element('app-main-content')
  const first = element('glow-card', scope)
  const second = element('motion-v2-surface', scope)
  const fire = (type, target, fields = {}) => {
    const event = Object.assign(new Event(type), fields)
    Object.defineProperty(event, 'target', { value: target })
    page.dispatchEvent(event)
  }
  const move = (target = first, clientX = 100, clientY = 50, pointerType = 'mouse') =>
    fire('pointermove', target, { clientX, clientY, pointerType })
  const flush = () => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback())
  }
  const dispose = attachGlassMaterialMotion(host, page)
  return { page, host, preferences, frames, scope, first, second, fire, move, flush, dispose }
}

describe('full glass local highlight budget', () => {
  it('coalesces a burst, measures only the latest card once, and has no idle loop', () => {
    const env = setup()
    expect(env.frames.size).toBe(0)
    env.move(env.first, 20, 20)
    env.move(env.second, 150, 75)
    env.move(env.second, 200, 100)
    expect(env.frames.size).toBe(1)
    env.flush()
    expect(env.first.getBoundingClientRect).not.toHaveBeenCalled()
    expect(env.second.getBoundingClientRect).toHaveBeenCalledTimes(1)
    expect(env.second.properties.get('--glass-highlight-x')).toBe('6.00px')
    expect(env.second.properties.get('--glass-highlight-y')).toBe('6.00px')
    expect(env.second.attributes.get('data-glass-highlight')).toBe('active')
    expect(env.frames.size).toBe(0)
    expect(env.page.querySelectorAll).not.toHaveBeenCalled()
    env.dispose()
  })

  it('uses the outer panel when the pointer passes over nested controls', () => {
    const env = setup()
    const nested = element('motion-v2-surface', env.first)
    const button = element('motion-v2-surface', nested, 'button')
    env.move(button)
    env.flush()
    expect(env.first.attributes.get('data-glass-highlight')).toBe('active')
    expect(nested.getBoundingClientRect).not.toHaveBeenCalled()
    expect(button.getBoundingClientRect).not.toHaveBeenCalled()
    env.dispose()
  })

  it('leaves navigation, standalone controls, the AI editor and dialogs untouched', () => {
    const env = setup()
    const dialog = element('glow-card', env.scope)
    dialog.setAttribute('role', 'dialog')
    for (const target of [
      element('glow-card'),
      element('motion-v2-surface', env.scope, 'button'),
      element('settle-ai-quick-card glow-card', env.scope),
      element('glow-card', element('wr-showcase', env.scope)),
      element('', dialog),
    ]) {
      env.move(target)
      expect(env.frames.size).toBe(0)
    }
    env.dispose()
  })

  it('clears the previous card, pending work and style variables on leave or scroll', () => {
    const env = setup()
    env.move()
    env.flush()
    env.move(env.second)
    expect(env.first.attributes.size).toBe(0)
    expect(env.first.properties.size).toBe(0)
    env.fire('pointerout', env.second, { relatedTarget: null })
    expect(env.frames.size).toBe(0)
    env.move()
    env.flush()
    env.fire('scroll', env.scope)
    expect(env.first.properties.size).toBe(0)
    expect(env.first.attributes.size).toBe(0)
    env.dispose()
  })

  it.each([
    '(prefers-reduced-motion: reduce)',
    '(prefers-reduced-transparency: reduce)',
    '(prefers-contrast: more)',
    '(pointer: coarse)',
    '(hover: none)',
  ])('suspends and resumes safely for %s', (query) => {
    const env = setup(query)
    env.move()
    expect(env.frames.size).toBe(0)
    const preference = env.preferences.get(query)
    preference.matches = false
    preference.dispatchEvent(new Event('change'))
    env.move()
    env.flush()
    expect(env.first.attributes.get('data-glass-highlight')).toBe('active')
    env.move()
    preference.matches = true
    preference.dispatchEvent(new Event('change'))
    expect(env.frames.size).toBe(0)
    expect(env.first.properties.size).toBe(0)
    env.dispose()
  })

  it('cancels when hidden or disposed and never restarts without a fresh pointer event', () => {
    const env = setup()
    env.move()
    env.page.hidden = true
    env.page.dispatchEvent(new Event('visibilitychange'))
    env.move()
    env.flush()
    expect(env.first.getBoundingClientRect).not.toHaveBeenCalled()
    env.page.hidden = false
    env.page.dispatchEvent(new Event('visibilitychange'))
    expect(env.frames.size).toBe(0)
    env.move()
    env.flush()
    env.move()
    env.dispose()
    env.move()
    env.host.dispatchEvent(new Event('resize'))
    env.page.dispatchEvent(new Event('visibilitychange'))
    env.flush()
    expect(env.frames.size).toBe(0)
    expect(env.first.properties.size).toBe(0)
    expect(env.first.attributes.size).toBe(0)
  })

  it('does not paint disconnected, zero-size or moved-away cards, or touch events', () => {
    const env = setup()
    env.move(env.first, 50, 50, 'touch')
    expect(env.frames.size).toBe(0)
    env.move()
    env.first.isConnected = false
    env.flush()
    expect(env.first.getBoundingClientRect).not.toHaveBeenCalled()
    env.first.isConnected = true
    env.first.getBoundingClientRect.mockReturnValue({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 })
    env.move()
    env.flush()
    expect(env.first.attributes.size).toBe(0)
    env.move(env.second, 300, 150)
    env.flush()
    expect(env.second.attributes.size).toBe(0)
    env.dispose()
  })
})
