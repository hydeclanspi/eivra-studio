import { createContext, useContext } from 'react'
export const TourContext = createContext(null)
export const useTour = () => useContext(TourContext)
