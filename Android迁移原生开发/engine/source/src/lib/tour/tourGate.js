import { brandLocalStorage, brandSessionStorage } from '../brandStorage'
import { TOUR_VERSION } from './tourScript'

export const TOUR_KEY = 'eivra.demo_tour.v1'
export const TOUR_SESSION_KEY = 'eivra.demo_tour.session.v1'
export const tourEligible = ({ pathname = '', mode, design = false, param }) =>
  mode === 'preview' && !design && !/^\/arsenal(?:\/|$)/.test(pathname) && !/^\/design/.test(pathname) && param !== '0'
export const readTourJSON = (storage, key) => {
  try { const value = JSON.parse(storage.getItem(key)); return value?.version === TOUR_VERSION ? value : null } catch { return null }
}
export const writeTourJSON = (storage, key, value) => {
  try { storage.setItem(key, JSON.stringify({ ...value, version: TOUR_VERSION })) } catch { /* Private browsing still supports an in-memory tour. */ }
}
export const readTourRecord = () => readTourJSON(brandLocalStorage, TOUR_KEY)
export const readTourSession = () => readTourJSON(brandSessionStorage, TOUR_SESSION_KEY)
export const rememberTour = (status) => writeTourJSON(brandLocalStorage, TOUR_KEY, { status, at: Date.now() })
export const saveTourSession = (record) => writeTourJSON(brandSessionStorage, TOUR_SESSION_KEY, record)
export const shouldAutoOffer = (pathname, status = 'idle') => ['/', '/new'].includes(pathname) && ['idle', 'done'].includes(status)
