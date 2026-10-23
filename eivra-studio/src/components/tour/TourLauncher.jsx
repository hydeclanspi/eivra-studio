import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTour } from './TourContext'
export default function TourLauncher({ mobile = false }) {
  const tour = useTour()
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const resize = () => setNarrow(window.innerWidth < 768)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  if (!tour?.eligible || mobile !== narrow) return null
  const button = <button type="button" data-tour="topbar.tourLauncher" className={`tour-launcher${mobile ? ' tour-launcher--mobile' : ''}`} onClick={() => tour.start()} aria-label="播放产品导览"><Play size={11} fill="currentColor" /><span>导览</span></button>
  return mobile ? createPortal(button, document.body) : button
}
