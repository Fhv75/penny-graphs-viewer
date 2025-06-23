import { useState, useCallback } from 'react'

export default function usePlotData() {
  const [showPlot, setShowPlot] = useState(false)
  const [angleData, setAngleData] = useState([])
  const [perimeterData, setPerimeterData] = useState([])

  const clearPlotData = useCallback(() => {
    setAngleData([])
    setPerimeterData([])
  }, [])
  
  const togglePlot = useCallback(() => {
    setShowPlot(!showPlot)
  }, [showPlot])

  return {
    showPlot,
    angleData,
    perimeterData,
    setShowPlot,
    setAngleData,
    setPerimeterData,
    togglePlot,
    clearPlotData
  }
}