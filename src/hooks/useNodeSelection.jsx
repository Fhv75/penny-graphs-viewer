import { useState, useCallback } from 'react'
import { marcarGrados } from '../utils/mathUtils'
import * as math from 'mathjs'

export default function useNodeSelection(netRef, movedCoordsRef, NODE_SIZE) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeCoords, setNodeCoords] = useState({ x: 0, y: 0 })
  const [coordInputs, setCoordInputs] = useState({ x: '0', y: '0' })
  const [inputErrors, setInputErrors] = useState({ x: false, y: false })

  const handleCoordChange = useCallback((axis, value) => {
    setCoordInputs((prev) => ({ ...prev, [axis]: value }))

    const degValue = marcarGrados(value.trim())
    try {
      let result = math.evaluate(degValue)
      if (typeof result === 'number' && !isNaN(result)) {
        if (axis === 'y') {
          result = -result
        }
        const actualCoord = result * NODE_SIZE
        setNodeCoords((prev) => ({ ...prev, [axis]: actualCoord }))
        setInputErrors((prev) => ({ ...prev, [axis]: false }))
      } else {
        setInputErrors((prev) => ({ ...prev, [axis]: true }))
      }
    } catch (error) {
      setInputErrors((prev) => ({ ...prev, [axis]: true }))
    }
  }, [NODE_SIZE])

  const applyCoordinates = useCallback(() => {
    if (selectedNode !== null && netRef.current && !inputErrors.x && !inputErrors.y) {
      const x = nodeCoords.x
      const y = nodeCoords.y

      netRef.current.moveNode(selectedNode, x, y)
      movedCoordsRef.current[selectedNode] = { x, y }
      netRef.current.redraw()
    }
  }, [selectedNode, nodeCoords, inputErrors])

  const handleKeyDown = useCallback((e) => {
    if (selectedNode === null) return
    
    if (e.key === 'Enter') {
      e.preventDefault()
      applyCoordinates()
    } else if (e.key === 'Escape' || e.key === 'q') {
      e.preventDefault()
      setSelectedNode(null)
    }
  }, [selectedNode, applyCoordinates])

  return {
    selectedNode,
    nodeCoords,
    coordInputs,
    inputErrors,
    setSelectedNode,
    handleCoordChange,
    applyCoordinates,
    handleKeyDown,
    setNodeCoords,
    setCoordInputs
  }
}