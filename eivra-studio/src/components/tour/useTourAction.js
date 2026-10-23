import { useEffect, useRef } from 'react'
import { tourBus } from '../../lib/tour/tourBus'

export default function useTourAction(name, handler) {
  const current = useRef(handler)
  current.current = handler
  useEffect(() => tourBus.register(name, (payload) => current.current(payload)), [name])
}
