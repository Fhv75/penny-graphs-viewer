import { useState, useCallback } from 'react'

export default function usePlotData() {
  const [showPlot, setShowPlot] = useState(false)
  const [plotData, setPlotData] = useState([])  // Array de objetos con toda la información del plot

  const clearPlotData = useCallback(() => {
    setPlotData([])
  }, [])
  
  const togglePlot = useCallback(() => {
    setShowPlot(!showPlot)
  }, [showPlot])

  return {
    showPlot,
    plotData,           // Nuevo: datos estructurados del plot
    setShowPlot,
    setPlotData,        // Nuevo: setter para datos estructurados
    togglePlot,
    clearPlotData
  }
}