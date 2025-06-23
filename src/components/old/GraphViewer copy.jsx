import React, { useEffect, useRef, useState } from 'react'
import { calculatePerimeter, marcarGrados } from '../../utils/mathUtils'
import { NodeInfoPanel } from '../NodeInfoPanel';
import { Network } from 'vis-network'
import DiskConvexHull from '../../algorithms/diskConvexHull/DiskConvexHull'
import RollingPlot from '../RollingPlot';
import HullInfoBar from '../HullInfoBar';
import RollingControls from '../RollingControls';
import * as math from 'mathjs'
import './styles.css';


const NODE_SIZE = 40
const SAFE_DIST   = NODE_SIZE

export default function GraphViewer({ graph, showHull }) {
  const containerRef = useRef(null)
  const netRef       = useRef(null)
  const showHullRef  = useRef(showHull)
  const movedCoordsRef = useRef({})

  // Plotting
  const [showPlot, setShowPlot] = useState(false);

  const clearPlotData = () => {
    setAngleData([]);
    setPerimeterData([]);
  };
  
  const togglePlot = () => {
    setShowPlot(!showPlot);
  };

  // Rolling animation ref
  const animationRef = useRef(null)

  const currentPerimeterRef = useRef(null)
  const [perimeter, setPerimeter] = useState(null)
  const [hullStats, setHullStats] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeCoords, setNodeCoords] = useState({ x: 0, y: 0 })
  const [coordInputs, setCoordInputs] = useState({ x: '0', y: '0' })
  const [inputErrors, setInputErrors] = useState({ x: false, y: false })

  // Rolling state
  const [rollingMode, setRollingMode] = useState(false)
  const [rollingDisk, setRollingDisk] = useState(null)
  const [anchorDisk, setAnchorDisk] = useState(null)
  const [rollingDirection, setRollingDirection] = useState(1) // 1 for counterclockwise, -1 for clockwise
  const [stepSize, setStepSize] = useState(1) // degrees
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [rollingDiskInput, setRollingDiskInput] = useState('')
  const [anchorDiskInput, setAnchorDiskInput] = useState('')

  // Rolling stats
  const [angleData, setAngleData] = useState([])
  const [perimeterData, setPerimeterData] = useState([])


  const setRollingDiskFromInput = () => {
    const nodeId = parseInt(rollingDiskInput)
    if (graph.nodes.includes(nodeId)) {
      setRollingDisk(nodeId)
      setRollingDiskInput('')
    } else {
      alert(`Node ${nodeId} not found`)
    }
  }
  
  const setAnchorDiskFromInput = () => {
    const nodeId = parseInt(anchorDiskInput)
    if (graph.nodes.includes(nodeId)) {
      setAnchorDisk(nodeId)
      setAnchorDiskInput('')
    } else {
      alert(`Node ${nodeId} not found`)
    }
  }

  const handleKeyDown = (e) => {
    if (selectedNode === null && !rollingMode) return
    
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!rollingMode) {
        applyCoordinates()
      }
    } else if (e.key === 'Escape' || e.key === 'q') {
      e.preventDefault()
      setSelectedNode(null)
      setRollingMode(false)
      setRollingDisk(null)
      setAnchorDisk(null)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        setIsAnimating(false)
      }
    }
  }
  
  const checkCollisions = () => {
    if (!rollingDisk || !anchorDisk) return false
    
    const rollingPos = movedCoordsRef.current[rollingDisk]
    if (!rollingPos) return false
    
    const allNodeIds = graph.nodes || []
    
    for (const nodeId of allNodeIds) {
      if (nodeId === rollingDisk || nodeId === anchorDisk) continue
      
      const otherPos = movedCoordsRef.current[nodeId]
      if (!otherPos) continue
      
      const dx = rollingPos.x - otherPos.x
      const dy = rollingPos.y - otherPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < NODE_SIZE * 2) {
        return true // Hay colisión
      }
    }
    
    return false // No hay colisión
  }

  const animateRolling = () => {
    if (typeof rollingDisk !== 'number' || typeof anchorDisk !== 'number' || !netRef.current) return
  
    const anchorPos = movedCoordsRef.current[anchorDisk]
    const rollingPos = movedCoordsRef.current[rollingDisk]
    
    if (!anchorPos || !rollingPos) return
  
    // Calculate distance between centers
    const distance = Math.sqrt(
      Math.pow(rollingPos.x - anchorPos.x, 2) + 
      Math.pow(rollingPos.y - anchorPos.y, 2)
    )
  
    // Convert step size to radians
    const stepRad = (stepSize * Math.PI) / 180 * rollingDirection
  
    // Calculate new angle
    const newAngle = currentAngle + stepRad

    setAngleData((prev) => [...prev, newAngle])
    setPerimeterData((prev) => [...prev, currentPerimeterRef.current || 0])

  
    // Calculate new position
    const newX = anchorPos.x + distance * Math.cos(newAngle)
    const newY = anchorPos.y + distance * Math.sin(newAngle)
  
    // **DETECCIÓN DE COLISIONES**
    // Verificar si el disco rodante colisionaría con algún otro disco (excepto el ancla)
    const allNodeIds = graph.nodes || []
    let collisionDetected = false
    
    for (const nodeId of allNodeIds) {
      if (nodeId === rollingDisk || nodeId === anchorDisk) continue
      
      const otherPos = movedCoordsRef.current[nodeId]
      if (!otherPos) continue
      
      // Calcular distancia entre el disco rodante (en su nueva posición) y el otro disco
      const dx = newX - otherPos.x
      const dy = newY - otherPos.y
      const distanceToOther = Math.sqrt(dx * dx + dy * dy)
      
      // Si la distancia es menor que 2 radios (considerando un pequeño margen)
      const minDistance = NODE_SIZE * 2 // 5 pixels de margen para evitar colisiones muy justas
      
      if (distanceToOther < minDistance) {
        collisionDetected = true
        console.log(`Collision detected with disk ${nodeId}`)
        break
      }
      console.log(angleData);
      console.log("asdasdasd")
    }
    
    // Si hay colisión, detener la animación
    if (collisionDetected) {
      setIsAnimating(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }
  
    // Si no hay colisión, continuar con el movimiento
    netRef.current.moveNode(rollingDisk, newX, newY)
    movedCoordsRef.current[rollingDisk] = { x: newX, y: newY }
    
    setCurrentAngle(newAngle)
    netRef.current.redraw()
  }
  
  const startRolling = () => {
    if (typeof rollingDisk !== 'number' || typeof anchorDisk !== 'number') return
    
    // Calculate initial angle
    const anchorPos = movedCoordsRef.current[anchorDisk]
    const rollingPos = movedCoordsRef.current[rollingDisk]
    
    const initialAngle = Math.atan2(
      rollingPos.y - anchorPos.y,
      rollingPos.x - anchorPos.x
    )
    
    setCurrentAngle(initialAngle)
    setIsAnimating(true)
  }
  
  const stopRolling = () => {
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  const stepRolling = () => {
    if (!isAnimating) {
      // Verificar colisión antes de hacer el paso
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
        
        // Verificar colisión en la nueva posición
        const allNodeIds = graph.nodes || []
        let wouldCollide = false
        
        for (const nodeId of allNodeIds) {
          if (nodeId === rollingDisk || nodeId === anchorDisk) continue
          
          const otherPos = movedCoordsRef.current[nodeId]
          if (!otherPos) continue
          
          const dx = newX - otherPos.x
          const dy = newY - otherPos.y
          const distanceToOther = Math.sqrt(dx * dx + dy * dy)
          
          if (distanceToOther < NODE_SIZE * 2) {
            wouldCollide = true
            break
          }
        }
        
        if (wouldCollide) {
          console.log('Step cancelled due to potential collision')
          return
        }
      }
      
      animateRolling()
    }
    
  }
  
  const toggleRollingMode = () => {
    setRollingMode(!rollingMode)
    setRollingDisk(null)
    setAnchorDisk(null)
    setSelectedNode(null)
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  const resetRollingSelection = () => {
    setRollingDisk(null)
    setAnchorDisk(null)
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  // Add useEffect to handle global keyboard events when a node is selected
  useEffect(() => {
    if (selectedNode !== null) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNode, inputErrors, nodeCoords, rollingMode])

  useEffect(() => {
    if (!graph) return
    if (netRef.current) netRef.current.destroy()

    const nodes = graph.nodes.map((id) => ({
      id,
      label: String(id),
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
    }))
    const edges = graph.edges.map(([f, t]) => ({ from: f, to: t }))

    const net = new Network(
      containerRef.current,
      { nodes, edges },
      {
        physics: false,
        nodes: { shape: 'dot', size: NODE_SIZE, color: '#8fbfff' },
        edges: { dashes: true, smooth: { type: 'cubicBezier', roundness: 0.1 } },
        interaction: { dragNodes: true, zoomView: true, dragView: true },
        layout: { improvedLayout: false },
      }
    )
    netRef.current = net

    nodes.forEach((nd) => {
      movedCoordsRef.current[nd.id] = { x: nd.x, y: nd.y }
    })

    

    const ids = graph.nodes
    const pushAway = (id) => {
      let changed = false
      let { x, y } = movedCoordsRef.current[id]
      for (const other of ids) {
        if (other === id) continue
        const { x: ox, y: oy } = movedCoordsRef.current[other]
        let dx = x - ox,
          dy = y - oy
        let dist2 = dx * dx + dy * dy
        if (dist2 === 0) {
          dx = 0.5
          dy = 0
          dist2 = dx * dx
        }
        const dist = Math.sqrt(dist2)
        if (dist < SAFE_DIST) {
          const shift = (SAFE_DIST - dist) / dist
          x += dx * shift
          y += dy * shift
          changed = true
        }
      }
      if (changed) {
        net.moveNode(id, x, y)
        movedCoordsRef.current[id] = { x, y }
      }
      return changed
    }

    // Initial separation of nodes
    for (let pass = 0; pass < 10; pass++) {
      let movedAny = false
      for (const id of ids) {
        if (pushAway(id)) movedAny = true
      }
      if (!movedAny) break
    }

    net.on('beforeDrawing', (ctx) => {
      if (!showHullRef.current) return

      const disks = ids.map((id) => {
        const stored = movedCoordsRef.current[id]
        if (stored) {
          return { x: stored.x, y: stored.y, r: NODE_SIZE }
        } else {
          const p = net.getPositions([id])[id]
          movedCoordsRef.current[id] = { x: p.x, y: p.y }
          return { x: p.x, y: p.y, r: NODE_SIZE }
        }
      })

      if (disks.length < 2) return

      try {
        const hullComputer = new DiskConvexHull()
        const result = hullComputer.compute(disks)

        const perimeterValue = calculatePerimeter(result.segments, NODE_SIZE)
        setPerimeter(perimeterValue)
        currentPerimeterRef.current = perimeterValue

        setHullStats(hullComputer.getStats())

        ctx.save()
        ctx.fillStyle = 'rgba(135,206,235,.15)'
        ctx.strokeStyle = 'skyblue'
        ctx.lineWidth = 2

        ctx.beginPath()
        let currentPoint = null

        for (const segment of result.segments) {
          if (segment.type === 'tangent') {
            if (
              !currentPoint ||
              Math.abs(currentPoint.x - segment.from.x) > 1e-6 ||
              Math.abs(currentPoint.y - segment.from.y) > 1e-6
            ) {
              ctx.moveTo(segment.from.x, segment.from.y)
            }
            ctx.lineTo(segment.to.x, segment.to.y)
            currentPoint = segment.to
          } else if (segment.type === 'arc') {
            const disk = segment.disk
            const startAngle = segment.startAngle
            const endAngle = segment.endAngle

            const startPoint = {
              x: disk.x + disk.r * Math.cos(startAngle),
              y: disk.y + disk.r * Math.sin(startAngle),
            }

            if (
              !currentPoint ||
              Math.abs(currentPoint.x - startPoint.x) > 1e-6 ||
              Math.abs(currentPoint.y - startPoint.y) > 1e-6
            ) {
              ctx.moveTo(startPoint.x, startPoint.y)
            }

            ctx.arc(disk.x, disk.y, disk.r, startAngle, endAngle, false)

            currentPoint = {
              x: disk.x + disk.r * Math.cos(endAngle),
              y: disk.y + disk.r * Math.sin(endAngle),
            }
          }
        }

        ctx.closePath()

        ctx.beginPath()
        currentPoint = null

        for (const segment of result.segments) {
          if (segment.type === 'tangent') {
            if (
              !currentPoint ||
              Math.abs(currentPoint.x - segment.from.x) > 1e-6 ||
              Math.abs(currentPoint.y - segment.from.y) > 1e-6
            ) {
              ctx.moveTo(segment.from.x, segment.from.y)
            }
            ctx.lineTo(segment.to.x, segment.to.y)
            currentPoint = segment.to
          } else if (segment.type === 'arc') {
            const disk = segment.disk
            const startAngle = segment.startAngle
            const endAngle = segment.endAngle

            const startPoint = {
              x: disk.x + disk.r * Math.cos(startAngle),
              y: disk.y + disk.r * Math.sin(startAngle),
            }

            if (
              !currentPoint ||
              Math.abs(currentPoint.x - startPoint.x) > 1e-6 ||
              Math.abs(currentPoint.y - startPoint.y) > 1e-6
            ) {
              ctx.moveTo(startPoint.x, startPoint.y)
            }

            ctx.arc(disk.x, disk.y, disk.r, startAngle, endAngle, false)

            currentPoint = {
              x: disk.x + disk.r * Math.cos(endAngle),
              y: disk.y + disk.r * Math.sin(endAngle),
            }
          }
        }

        ctx.stroke()

        ctx.restore()
      } catch (error) {
        console.error('Error computing hull:', error)
        setPerimeter(null)
        setHullStats(null)
      }
    })

    net.on('dragging', (e) => {
      if (!e.nodes.length) return
      const nodeId = e.nodes[0]
      const posNow = net.getPositions([nodeId])[nodeId]
      movedCoordsRef.current[nodeId] = { x: posNow.x, y: posNow.y }
      pushAway(nodeId)
    })

    

net.on('dragging', (e) => {
  if (!e.nodes.length) return
  const nodeId = e.nodes[0]
  const posNow = net.getPositions([nodeId])[nodeId]
  movedCoordsRef.current[nodeId] = { x: posNow.x, y: posNow.y }
})

net.on('dragEnd', (params) => {
  if (params.nodes.length === 0) return
  const draggedNodeId = params.nodes[0]
  const posFinal = net.getPositions([draggedNodeId])[draggedNodeId]
  movedCoordsRef.current[draggedNodeId] = { x: posFinal.x, y: posFinal.y }
  
  // Now apply repulsion after drag ends
  const allNodeIds = graph.nodes
  
  // Function to resolve overlaps for all nodes
  const resolveAllOverlaps = () => {
    let globalChange = false
    
    for (const nodeId of allNodeIds) {
      const currentPos = movedCoordsRef.current[nodeId] || net.getPositions([nodeId])[nodeId]
      let { x, y } = currentPos
      let localChange = false
      
      for (const otherId of allNodeIds) {
        if (otherId === nodeId) continue
        
        const otherPos = movedCoordsRef.current[otherId] || net.getPositions([otherId])[otherId]
        let dx = x - otherPos.x
        let dy = y - otherPos.y
        let dist2 = dx * dx + dy * dy
        
        if (dist2 === 0) {
          dx = (Math.random() - 0.5) * 10
          dy = (Math.random() - 0.5) * 10
          dist2 = dx * dx + dy * dy
        }
        
        const dist = Math.sqrt(dist2)
        const minDist = SAFE_DIST * 2 // Use your SAFE_DIST constant
        
        if (dist < minDist && dist > 0) {
          const pushFactor = (minDist - dist) / dist * 0.5
          x += dx * pushFactor
          y += dy * pushFactor
          localChange = true
        }
      }
      
      if (localChange) {
        net.moveNode(nodeId, x, y)
        movedCoordsRef.current[nodeId] = { x, y }
        globalChange = true
      }
    }
    
    return globalChange
  }
  
  // Apply repulsion in iterations until stable
  for (let iteration = 0; iteration < 10; iteration++) {
    if (!resolveAllOverlaps()) {
      break // No more overlaps to resolve
    }
  }
  
  // Redraw to ensure hull is updated
  net.redraw()
})

    net.on('click', (params) => {
      if (rollingMode) {
        // Handle rolling mode clicks
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          if (typeof rollingDisk !== 'number') {
            setRollingDisk(nodeId)
          } else if (typeof anchorDisk !== 'number' && nodeId !== rollingDisk) {
            setAnchorDisk(nodeId)
          }
        }
      } else {
        // Your existing click handler code
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          let exactPos = movedCoordsRef.current[nodeId]
          if (!exactPos) {
            const p = net.getPositions([nodeId])[nodeId]
            exactPos = { x: p.x, y: p.y}
            movedCoordsRef.current[nodeId] = exactPos
          }
          setSelectedNode(nodeId)

          const normalizedCoords = {
            x: exactPos.x / NODE_SIZE,
            y: exactPos.y / NODE_SIZE,
          }

          setNodeCoords({ x: exactPos.x, y: exactPos.y })
          setCoordInputs({
            x: normalizedCoords.x.toFixed(8),
            y: normalizedCoords.y.toFixed(8) * -1,
          })
          setInputErrors({ x: false, y: false })
        } else {
          setSelectedNode(null)
        }
      }
    })

    return () => net.destroy()
  }, [graph])

  useEffect(() => {
    showHullRef.current = showHull
    netRef.current?.redraw()
  }, [showHull])

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
  }, [isAnimating, rollingDisk, anchorDisk, stepSize, rollingDirection, currentAngle])

  const handleCoordChange = (axis, value) => {
    setCoordInputs((prev) => ({ ...prev, [axis]: value }))

    const degValue = marcarGrados(value.trim())
    try {
      let result = math.evaluate(degValue)
      if (typeof result === 'number' && !isNaN(result)) {
        if (axis === 'y') {
          result = -result // Invert Y for canvas coordinates
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
  }

  const applyCoordinates = () => {
    if (selectedNode !== null && netRef.current && !inputErrors.x && !inputErrors.y) {
      const x = nodeCoords.x
      const y = nodeCoords.y

      netRef.current.moveNode(selectedNode, x, y)
      movedCoordsRef.current[selectedNode] = { x, y }
      netRef.current.redraw()
    }
  }

  return (
    <div className="main-container">
      <div ref={containerRef} className="canvas-container" />

      {selectedNode !== null && (
        <NodeInfoPanel 
          nodeId={selectedNode}
          nodeCoords={nodeCoords}
          coordInputs={coordInputs}
          inputErrors={inputErrors}
          onChange={handleCoordChange}
          onApply={applyCoordinates}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {rollingMode && (
        <RollingControls
        rollingDisk={rollingDisk}
        anchorDisk={anchorDisk}
        rollingDiskInput={rollingDiskInput}
        anchorDiskInput={anchorDiskInput}
        onRollingDiskInputChange={e => setRollingDiskInput(e.target.value)}
        onSetRollingDisk={setRollingDiskFromInput}
        onAnchorDiskInputChange={e => setAnchorDiskInput(e.target.value)}
        onSetAnchorDisk={setAnchorDiskFromInput}
        rollingDirection={rollingDirection}
        onDirectionChange={e => setRollingDirection(parseInt(e.target.value, 10))}
        stepSize={stepSize}
        onStepSizeChange={e => setStepSize(Number(e.target.value))}
        isAnimating={isAnimating}
        onStartStop={() => (isAnimating ? stopRolling() : startRolling())}
        onStep={stepRolling}
        onReset={resetRollingSelection}
        onTogglePlot={togglePlot}
        onClearPlot={clearPlotData}
        showPlot={showPlot}
      />
      )}

      <HullInfoBar 
        perimeter={perimeter}
        hullStats={hullStats}
        rollingMode={rollingMode}
        toggleRollingMode={toggleRollingMode}
      />

      <RollingPlot
        angleData={angleData}
        perimeterData={perimeterData}
        isVisible={showPlot}
        onClose={() => setShowPlot(false)}
      />
    </div>
  );
}

