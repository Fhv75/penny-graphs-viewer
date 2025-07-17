// hooks/useMultiRollingAnimation.js
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
  const [rollingDisks, setRollingDisks] = useState([]) // Array de {id, direction}
  const [anchorDisk, setAnchorDisk] = useState(null)
  const [stepSize, setStepSize] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [rollingDiskInput, setRollingDiskInput] = useState('')
  const [anchorDiskInput, setAnchorDiskInput] = useState('')
  
  const animationRef = useRef(null)
  const initialPositionsRef = useRef({})

  // Función para verificar colisiones
  const checkCollisions = useCallback((diskId, newX, newY) => {
    // Get all node IDs that we need to check against
    const allNodeIds = graph.nodes || []
    
    // Create a set of rolling disk IDs for quick lookup
    const rollingDiskIds = new Set(rollingDisks.map(disk => disk.id))
    
    for (const nodeId of allNodeIds) {
      // Skip if it's the current disk, the anchor, or another rolling disk
      if (nodeId === diskId || nodeId === anchorDisk || rollingDiskIds.has(nodeId)) continue
      
      // Get the position of the other node
      const otherPos = movedCoordsRef.current[nodeId] || 
                      (netRef.current && netRef.current.getPositions([nodeId])[nodeId])
      if (!otherPos) continue
      
      // Calculate distance between centers
      const dx = newX - otherPos.x
      const dy = newY - otherPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Check if collision (when centers are closer than 2 * nodeSize)
      if (distance < nodeSize * 2) {
        return true
      }
    }
    
    return false
  }, [rollingDisks, anchorDisk, graph.nodes, nodeSize])

  // Función para agregar un disco rodante
  const addRollingDisk = useCallback((diskId, direction) => {
    // Verificar que el disco existe en el grafo
    const node = graph.nodes.find(n => n === diskId)
    if (node === null || node === undefined) {
      alert(`Disco ${diskId} no existe`)
      return
    }

    // Verificar que no es el disco ancla
    if (diskId === anchorDisk) {
      alert(`El disco ${diskId} ya es el ancla`)
      return
    }

    // Verificar que no está ya en la lista
    const exists = rollingDisks.some(disk => disk.id === diskId)
    if (exists) {
      alert(`El disco ${diskId} ya está en la lista de rolling`)
      return
    }

    setRollingDisks(prev => [...prev, { id: diskId, direction }])
  }, [graph.nodes, anchorDisk, rollingDisks])

  // Función para remover un disco rodante
  const removeRollingDisk = useCallback((index) => {
    setRollingDisks(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Función para actualizar dirección de un disco
  const updateRollingDiskDirection = useCallback((index, direction) => {
    setRollingDisks(prev => prev.map((disk, i) => 
      i === index ? { ...disk, direction } : disk
    ))
  }, [])

  // Función para establecer el disco ancla desde input
  const setAnchorDiskFromInput = useCallback(() => {
    const diskId = parseInt(anchorDiskInput, 10)
    if (isNaN(diskId)) {
      alert('ID de disco inválido')
      return  
    }

    const node = graph.nodes.find(n => n === diskId)
    if (node === null || node === undefined) {
      alert(`Disco ${diskId} no existe`)
      return
    }

    // Remover de rolling disks si existe
    setRollingDisks(prev => prev.filter(disk => disk.id !== diskId))
    setAnchorDisk(diskId)
  }, [anchorDiskInput, graph.nodes])

  // Función para calcular nueva posición de un nodo después del rolling
  const calculateNewPosition = useCallback((nodeId, anchorId, angleRad, direction) => {
    if (!netRef.current) return null

    const network = netRef.current
    const anchorPos = movedCoordsRef.current[anchorId] || network.getPositions([anchorId])[anchorId]
    const nodePos = movedCoordsRef.current[nodeId] || network.getPositions([nodeId])[nodeId]
    
    if (!anchorPos || !nodePos) return null

    // Calcular el vector desde anchor al nodo
    const dx = nodePos.x - anchorPos.x
    const dy = nodePos.y - anchorPos.y
    const radius = Math.sqrt(dx * dx + dy * dy)
    
    // Calcular ángulo actual
    const currentAngle = Math.atan2(dy, dx)
    
    // Aplicar rotación (direction determina sentido)
    const newAngle = currentAngle + (angleRad * direction)
    
    // Calcular nueva posición
    const newX = anchorPos.x + radius * Math.cos(newAngle)
    const newY = anchorPos.y + radius * Math.sin(newAngle)
    
    return { x: newX, y: newY }
  }, [])

  // Función mejorada para capturar el perímetro después del redraw
  const capturePerimeterAfterRedraw = useCallback((callback) => {
    if (!netRef.current) {
      callback(perimeter)
      return
    }

    // Use vis-network's afterDrawing event to capture perimeter after hull is recomputed
    const captureOnce = () => {
      const updatedPerimeter = currentPerimeterRef?.current ?? perimeter
      callback(updatedPerimeter)
    }

    // Set up a one-time listener for the next afterDrawing event
    netRef.current.once('afterDrawing', captureOnce)
    
    // Also set a timeout as fallback
    setTimeout(() => {
      netRef.current.off('afterDrawing', captureOnce) // Remove listener if not fired
      captureOnce()
    }, 100)
  }, [perimeter, currentPerimeterRef])

  // Función para detener animación (defined early to avoid hoisting issues)
  const stopRolling = useCallback(() => {
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  // Función para ejecutar un paso de rolling
  const stepRolling = useCallback(() => {
    if (!netRef.current || rollingDisks.length === 0 || anchorDisk === null) return

    const network = netRef.current
    const angleRad = (stepSize * Math.PI) / 180
    const diskAngles = {}
    let totalAngleMoved = 0

    // First, calculate all new positions and check for collisions
    const newPositions = {}
    let hasCollision = false

    for (const disk of rollingDisks) {
      const newPos = calculateNewPosition(disk.id, anchorDisk, angleRad, disk.direction)
      if (newPos) {
        // Check if this new position would cause a collision
        if (checkCollisions(disk.id, newPos.x, newPos.y)) {
          hasCollision = true
          console.log(`Collision detected for disk ${disk.id} at position (${newPos.x}, ${newPos.y})`)
          break
        }
        newPositions[disk.id] = newPos
      }
    }

    // If any collision was detected, stop the animation and don't move any disks
    if (hasCollision) {
      stopRolling()
      return
    }

    // If no collisions, apply all movements
    rollingDisks.forEach(disk => {
      const newPos = newPositions[disk.id]
      if (newPos) {
        // Usar moveNode como en el código original
        network.moveNode(disk.id, newPos.x, newPos.y)
        // Actualizar referencia de coordenadas movidas
        movedCoordsRef.current[disk.id] = newPos
        
        // Almacenar el ángulo movido para este disco (en radianes)
        const diskAngleMoved = angleRad * disk.direction
        diskAngles[disk.id] = diskAngleMoved
        totalAngleMoved += Math.abs(diskAngleMoved)
      }
    })

    // Actualizar ángulo actual y redibujar
    const newCurrentAngle = currentAngle + stepSize
    setCurrentAngle(newCurrentAngle)
    network.redraw()
    
    // Capturar el perímetro después del redraw
    capturePerimeterAfterRedraw((updatedPerimeter) => {
      if (setPlotData) {
        const plotDataPoint = {
          perimeter: updatedPerimeter,
          diskAngles: diskAngles,
          totalAngleMoved: totalAngleMoved,
          stepAngle: angleRad,
          currentAngle: newCurrentAngle,
          timestamp: Date.now()
        }
        
        // console.log('Adding plot data point:', plotDataPoint);
        
        // setPlotData recibe el objeto completo con toda la información
        setPlotData(prev => [...prev, plotDataPoint])
      }
    })
    
  }, [rollingDisks, anchorDisk, stepSize, calculateNewPosition, currentAngle, capturePerimeterAfterRedraw, setPlotData, checkCollisions, stopRolling])

  // Función para iniciar animación
  const startRolling = useCallback(() => {
    if (rollingDisks.length === 0 || anchorDisk === null) return

    setIsAnimating(true)
    
    const animate = () => {
      stepRolling()
      // Continue animation only if still animating (stepRolling might stop it due to collision)
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [rollingDisks, anchorDisk, stepRolling])

  // Función para resetear selección
  const resetRollingSelection = useCallback(() => {
    stopRolling()
    setRollingDisks([])
    setAnchorDisk(null)
    setCurrentAngle(0)
    setRollingDiskInput('')
    setAnchorDiskInput('')
    
    // Restaurar posiciones iniciales si las hay
    if (netRef.current && Object.keys(initialPositionsRef.current).length > 0) {
      Object.entries(initialPositionsRef.current).forEach(([nodeId, pos]) => {
        netRef.current.moveNode(parseInt(nodeId), pos.x, pos.y)
      })
      
      // Limpiar coordenadas movidas
      Object.keys(initialPositionsRef.current).forEach(nodeId => {
        delete movedCoordsRef.current[nodeId]
      })
      
      netRef.current.redraw()
    }
  }, [stopRolling])

  // Guardar posiciones iniciales cuando se activa rolling mode
  const handleRollingModeChange = useCallback((newMode) => {
    if (newMode && netRef.current) {
      // Guardar posiciones actuales como iniciales
      const currentPositions = netRef.current.getPositions()
      initialPositionsRef.current = { ...currentPositions }
    } else if (!newMode) {
      // Resetear cuando se desactiva
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