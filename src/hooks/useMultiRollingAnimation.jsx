import { useState, useRef, useCallback } from 'react'

export default function useMultiRollingAnimation(
  graph, 
  netRef, 
  movedCoordsRef, 
  nodeSize, 
  perimeter, 
  setPlotData,
  setPerimeterData,
  currentPerimeterRef
) {
  const [rollingMode, setRollingMode] = useState(false)
  const [rollingDisks, setRollingDisks] = useState([]) 
  const [anchorDisk, setAnchorDisk] = useState(null)
  const [stepSize, setStepSize] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0) 
  const [rollingDiskInput, setRollingDiskInput] = useState('')
  const [anchorDiskInput, setAnchorDiskInput] = useState('')

  const [stopConfig, setStopConfig] = useState({
    mode: 'none',
    angleDeg: 90,
    region: { x: null, cmpX: '>=', y: null, cmpY: '>=', eps: 1.0 }
  })

  const animationRef = useRef(null)
  const initialPositionsRef = useRef({})
  const startedRef = useRef(false)

  const cmp = (a, op, b, eps=0) => {
    if (b == null || Number.isNaN(b)) return true 
    if (op === '>=') return a >= (b - eps)
    if (op === '<=') return a <= (b + eps)
    return true
  }

  const checkCollisions = useCallback((diskId, newX, newY) => {
    const allNodeIds = graph.nodes || []
    const rollingDiskIds = new Set(rollingDisks.map(disk => disk.id))
    for (const nodeId of allNodeIds) {
      if (nodeId === diskId || nodeId === anchorDisk || rollingDiskIds.has(nodeId)) continue
      const otherPos = movedCoordsRef.current[nodeId] || (netRef.current && netRef.current.getPositions([nodeId])[nodeId])
      if (!otherPos) continue
      const dx = newX - otherPos.x
      const dy = newY - otherPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < nodeSize * 2) return true
    }
    return false
  }, [rollingDisks, anchorDisk, graph.nodes, nodeSize])

  const addRollingDisk = useCallback((diskId, direction) => {
    const node = graph.nodes.find(n => n === diskId)
    if (node == null) { alert(`Disco ${diskId} no existe`); return }
    if (diskId === anchorDisk) { alert(`El disco ${diskId} ya es el ancla`); return }
    if (rollingDisks.some(d => d.id === diskId)) { alert(`El disco ${diskId} ya está en rolling`); return }
    setRollingDisks(prev => [...prev, { id: diskId, direction }])
  }, [graph.nodes, anchorDisk, rollingDisks])

  const removeRollingDisk = useCallback((index) => {
    setRollingDisks(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateRollingDiskDirection = useCallback((index, direction) => {
    setRollingDisks(prev => prev.map((disk, i) => i === index ? { ...disk, direction } : disk))
  }, [])

  const setAnchorDiskFromInput = useCallback(() => {
    const diskId = parseInt(anchorDiskInput, 10)
    if (isNaN(diskId)) { alert('ID de disco inválido'); return }
    const node = graph.nodes.find(n => n === diskId)
    if (node == null) { alert(`Disco ${diskId} no existe`); return }
    setRollingDisks(prev => prev.filter(d => d.id !== diskId))
    setAnchorDisk(diskId)
  }, [anchorDiskInput, graph.nodes])

  const calculateNewPosition = useCallback((nodeId, anchorId, angleRad, direction) => {
    if (!netRef.current) return null
    const network = netRef.current
    const anchorPos = movedCoordsRef.current[anchorId] || network.getPositions([anchorId])[anchorId]
    const nodePos   = movedCoordsRef.current[nodeId]   || network.getPositions([nodeId])[nodeId]
    if (!anchorPos || !nodePos) return null
    const dx = nodePos.x - anchorPos.x
    const dy = nodePos.y - anchorPos.y
    const radius = Math.sqrt(dx * dx + dy * dy)
    const currentAngle = Math.atan2(dy, dx)
    const newAngle = currentAngle + (angleRad * direction)
    return { x: anchorPos.x + radius * Math.cos(newAngle),
             y: anchorPos.y + radius * Math.sin(newAngle) }
  }, [])

  const capturePerimeterAfterRedraw = useCallback((callback) => {
    if (!netRef.current) { callback(perimeter); return }
    const captureOnce = () => {
      const updated = currentPerimeterRef?.current ?? perimeter
      callback(updated)
    }
    netRef.current.once('afterDrawing', captureOnce)
    setTimeout(() => {
      netRef.current?.off('afterDrawing', captureOnce)
      captureOnce()
    }, 100)
  }, [perimeter, currentPerimeterRef])

  const stopRolling = useCallback(() => {
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    startedRef.current = false
  }, [])

  const shouldStopByAngle = useCallback((nextAngleDeg) => {
    if (stopConfig.mode !== 'angle') return false
    return Math.abs(nextAngleDeg) >= (Number(stopConfig.angleDeg) || 0)
  }, [stopConfig])

  const shouldStopByRegion = useCallback((proposedPositionsByDisk) => {
    if (stopConfig.mode !== 'region') return false
    const { x, cmpX, y, cmpY, eps } = stopConfig.region || {}

    for (const [diskId, pos] of Object.entries(proposedPositionsByDisk)) {
      const okX = (x == null) ? true : cmp(pos.x, cmpX || '>=', Number(x), Number(eps)||0)
      const okY = (y == null) ? true : cmp(pos.y, cmpY || '>=', Number(y), Number(eps)||0)
      if (x != null && y != null) {
        if (okX && okY) return true
      } else if (x != null && okX) {
        return true
      } else if (y != null && okY) {
        return true
      }
    }
    return false
  }, [stopConfig])

  const stepRolling = useCallback(() => {
    if (!netRef.current || rollingDisks.length === 0 || anchorDisk === null) return

    const network = netRef.current
    const angleRad = (stepSize * Math.PI) / 180
    const diskAngles = {}
    let totalAngleMoved = 0

    const newPositions = {}
    let hasCollision = false
    for (const disk of rollingDisks) {
      const newPos = calculateNewPosition(disk.id, anchorDisk, angleRad, disk.direction)
      if (newPos) {
        if (checkCollisions(disk.id, newPos.x, newPos.y)) { hasCollision = true; break }
        newPositions[disk.id] = newPos
      }
    }
    if (hasCollision) { stopRolling(); return }

    if (shouldStopByRegion(newPositions)) {
      stopRolling()
      return
    }

    rollingDisks.forEach(disk => {
      const newPos = newPositions[disk.id]
      if (newPos) {
        network.moveNode(disk.id, newPos.x, newPos.y)
        movedCoordsRef.current[disk.id] = newPos
        const diskAngleMoved = angleRad * disk.direction
        diskAngles[disk.id] = diskAngleMoved
        totalAngleMoved += Math.abs(diskAngleMoved)
      }
    })

    const newCurrentAngle = currentAngle + stepSize
    setCurrentAngle(newCurrentAngle)
    network.redraw()

    if (shouldStopByAngle(newCurrentAngle)) {
      capturePerimeterAfterRedraw((updatedPerimeter) => {
        if (setPlotData) {
          setPlotData(prev => [...prev, {
            perimeter: updatedPerimeter,
            diskAngles,
            totalAngleMoved,
            stepAngle: angleRad,
            currentAngle: newCurrentAngle,
            timestamp: Date.now()
          }])
        }
        stopRolling()
      })
      return
    }

    capturePerimeterAfterRedraw((updatedPerimeter) => {
      if (setPlotData) {
        setPlotData(prev => [...prev, {
          perimeter: updatedPerimeter,
          diskAngles,
          totalAngleMoved,
          stepAngle: angleRad,
          currentAngle: newCurrentAngle,
          timestamp: Date.now()
        }])
      }
    })
  }, [
    rollingDisks, anchorDisk, stepSize, calculateNewPosition, currentAngle,
    capturePerimeterAfterRedraw, setPlotData, checkCollisions,
    shouldStopByAngle, shouldStopByRegion, stopRolling
  ])

  const startRolling = useCallback(() => {
    if (rollingDisks.length === 0 || anchorDisk === null) return
    if (!startedRef.current) {
      setCurrentAngle(0)
      startedRef.current = true
    }
    setIsAnimating(true)
    const animate = () => {
      stepRolling()
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [rollingDisks, anchorDisk, stepRolling])

  const resetRollingSelection = useCallback(() => {
    stopRolling()
    setRollingDisks([])
    setAnchorDisk(null)
    setCurrentAngle(0)
    setRollingDiskInput('')
    setAnchorDiskInput('')
    setStopConfig({ mode: 'none', angleDeg: 90, region: { x: null, cmpX: '>=', y: null, cmpY: '>=', eps: 1.0 } })
    if (netRef.current && Object.keys(initialPositionsRef.current).length > 0) {
      Object.entries(initialPositionsRef.current).forEach(([nodeId, pos]) => {
        netRef.current.moveNode(parseInt(nodeId), pos.x, pos.y)
      })
      Object.keys(initialPositionsRef.current).forEach(nodeId => {
        delete movedCoordsRef.current[nodeId]
      })
      netRef.current.redraw()
    }
    startedRef.current = false
  }, [stopRolling])

  const handleRollingModeChange = useCallback((newMode) => {
    if (newMode && netRef.current) {
      const currentPositions = netRef.current.getPositions()
      initialPositionsRef.current = { ...currentPositions }
    } else if (!newMode) {
      resetRollingSelection()
    }
    setRollingMode(newMode)
  }, [resetRollingSelection])

  return {
    rollingMode,
    rollingDisks,
    anchorDisk,
    stepSize,
    isAnimating,
    currentAngle,
    rollingDiskInput,
    anchorDiskInput,
    stopConfig,           
    setStopConfig,        
    setRollingDiskInput,
    setAnchorDiskInput,
    setStepSize,
    setRollingMode: handleRollingModeChange,
    addRollingDisk,
    removeRollingDisk,
    updateRollingDiskDirection,
    setAnchorDisk,
    startRolling,
    stopRolling,
    stepRolling,
    resetRollingSelection,
    setAnchorDiskFromInput
  }
}
