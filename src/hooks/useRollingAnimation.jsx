import { useState, useRef, useEffect, useCallback } from 'react'

export default function useRollingAnimation(graph, netRef, movedCoordsRef, NODE_SIZE, perimeter, setAngleData, setPerimeterData) {
  const [rollingMode, setRollingMode] = useState(false)
  const [rollingDisk, setRollingDisk] = useState(null)
  const [anchorDisk, setAnchorDisk] = useState(null)
  const [rollingDirection, setRollingDirection] = useState(1)
  const [stepSize, setStepSize] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [rollingDiskInput, setRollingDiskInput] = useState('')
  const [anchorDiskInput, setAnchorDiskInput] = useState('')
  
  const animationRef = useRef(null)

  const checkCollisions = useCallback((newX, newY) => {
    // Cambiar la condición para verificar explícitamente null/undefined en lugar de falsy
    if (rollingDisk === null || rollingDisk === undefined || 
        anchorDisk === null || anchorDisk === undefined) return false
    
    const allNodeIds = graph.nodes || []
    
    for (const nodeId of allNodeIds) {
      if (nodeId === rollingDisk || nodeId === anchorDisk) continue
      
      const otherPos = movedCoordsRef.current[nodeId]
      if (!otherPos) continue
      
      const dx = newX - otherPos.x
      const dy = newY - otherPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < NODE_SIZE * 2) {
        return true
      }
    }
    
    return false
  }, [rollingDisk, anchorDisk, graph.nodes, NODE_SIZE])

  const animateRolling = useCallback(() => {
    // Cambiar también aquí la verificación
    if (rollingDisk === null || rollingDisk === undefined || 
        anchorDisk === null || anchorDisk === undefined || !netRef.current) return
  
    const anchorPos = movedCoordsRef.current[anchorDisk]
    const rollingPos = movedCoordsRef.current[rollingDisk]
    
    if (!anchorPos || !rollingPos) return
  
    const distance = Math.sqrt(
      Math.pow(rollingPos.x - anchorPos.x, 2) + 
      Math.pow(rollingPos.y - anchorPos.y, 2)
    )
  
    const stepRad = (stepSize * Math.PI) / 180 * rollingDirection
    const newAngle = currentAngle + stepRad
    const newX = anchorPos.x + distance * Math.cos(newAngle)
    const newY = anchorPos.y + distance * Math.sin(newAngle)
    
    if (checkCollisions(newX, newY)) {
      setIsAnimating(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    // Actualizar datos del plot
    setAngleData((prev) => [...prev, newAngle])
    setPerimeterData((prev) => [...prev, perimeter || 0])
  
    netRef.current.moveNode(rollingDisk, newX, newY)
    movedCoordsRef.current[rollingDisk] = { x: newX, y: newY }
    
    setCurrentAngle(newAngle)
    netRef.current.redraw()
  }, [rollingDisk, anchorDisk, stepSize, rollingDirection, currentAngle, checkCollisions, perimeter, setAngleData, setPerimeterData])

  const startRolling = useCallback(() => {
    // Cambiar también aquí la verificación
    if (rollingDisk === null || rollingDisk === undefined || 
        anchorDisk === null || anchorDisk === undefined) return
    
    const anchorPos = movedCoordsRef.current[anchorDisk]
    const rollingPos = movedCoordsRef.current[rollingDisk]
    
    const initialAngle = Math.atan2(
      rollingPos.y - anchorPos.y,
      rollingPos.x - anchorPos.x
    )
    
    setCurrentAngle(initialAngle)
    setIsAnimating(true)
  }, [rollingDisk, anchorDisk])

  const stopRolling = useCallback(() => {
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const stepRolling = useCallback(() => {
    if (!isAnimating) {
      const currentPos = movedCoordsRef.current[rollingDisk]
      const anchorPos = movedCoordsRef.current[anchorDisk]
      
      if (currentPos && anchorPos) {
        const distance = Math.sqrt(
          Math.pow(currentPos.x - anchorPos.x, 2) + 
          Math.pow(currentPos.y - anchorPos.y, 2)
        )
        
        const stepRad = (stepSize * Math.PI) / 180 * rollingDirection
        const newAngle = currentAngle + stepRad
        const newX = anchorPos.x + distance * Math.cos(newAngle)
        const newY = anchorPos.y + distance * Math.sin(newAngle)
        
        if (checkCollisions(newX, newY)) {
          console.log('Step cancelled due to potential collision')
          return
        }

        // Actualizar datos del plot también en step manual
        setAngleData((prev) => [...prev, newAngle])
        setPerimeterData((prev) => [...prev, perimeter || 0])
      }
      
      animateRolling()
    }
  }, [isAnimating, rollingDisk, anchorDisk, stepSize, rollingDirection, currentAngle, checkCollisions, animateRolling, perimeter, setAngleData, setPerimeterData])

  const resetRollingSelection = useCallback(() => {
    setRollingDisk(null)
    setAnchorDisk(null)
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const setRollingDiskFromInput = useCallback(() => {
    const nodeId = parseInt(rollingDiskInput)
    if (graph.nodes.includes(nodeId)) {
      setRollingDisk(nodeId)
      setRollingDiskInput('')
    } else {
      alert(`Node ${nodeId} not found`)
    }
  }, [rollingDiskInput, graph.nodes])

  const setAnchorDiskFromInput = useCallback(() => {
    const nodeId = parseInt(anchorDiskInput)
    if (graph.nodes.includes(nodeId)) {
      setAnchorDisk(nodeId)
      setAnchorDiskInput('')
    } else {
      alert(`Node ${nodeId} not found`)
    }
  }, [anchorDiskInput, graph.nodes])

  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        animateRolling()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAnimating, animateRolling])

  return {
    rollingMode,
    rollingDisk,
    anchorDisk,
    rollingDirection,
    stepSize,
    isAnimating,
    currentAngle,
    rollingDiskInput,
    anchorDiskInput,
    setRollingDiskInput,
    setAnchorDiskInput,
    setRollingDirection,
    setStepSize,
    setRollingMode,
    setRollingDisk,
    setAnchorDisk,
    startRolling,
    stopRolling,
    stepRolling,
    resetRollingSelection,
    setRollingDiskFromInput,
    setAnchorDiskFromInput
  }
}