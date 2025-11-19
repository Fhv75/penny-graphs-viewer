import { useState, useCallback } from 'react'

export default function usePlotData() {
  const [showPlot, setShowPlot] = useState(false)
  const [plotData, setPlotData] = useState([]) 

  const clearPlotData = useCallback(() => {
    setPlotData([])
  }, [])
  
  const togglePlot = useCallback(() => {
    setShowPlot(!showPlot)
  }, [showPlot])

  return {
    showPlot,
    plotData,           
    setShowPlot,
    setPlotData,       
    togglePlot,
    clearPlotData
  }
}