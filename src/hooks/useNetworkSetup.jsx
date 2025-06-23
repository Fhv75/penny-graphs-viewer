import { useEffect, useState, useRef } from 'react'
import { calculatePerimeter } from '../utils/mathUtils'
import DiskConvexHull from '../algorithms/diskConvexHull/DiskConvexHull'
import { Network } from 'vis-network'

export default function useNetworkSetup(graph, showHull, containerRef, netRef, movedCoordsRef, NODE_SIZE, SAFE_DIST, setSelectedNode, setNodeCoords, setCoordInputs) {
  const [perimeter, setPerimeter] = useState(null)
  const [hullStats, setHullStats] = useState(null)
  const showHullRef = useRef(showHull)
  const currentPerimeterRef = useRef(null)

  const pushAway = (id, net, ids) => {
    let changed = false
    let { x, y } = movedCoordsRef.current[id]
    for (const other of ids) {
      if (other === id) continue
      const { x: ox, y: oy } = movedCoordsRef.current[other]
      let dx = x - ox, dy = y - oy
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

  const resolveAllOverlaps = (net, allNodeIds) => {
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
        const minDist = SAFE_DIST * 2
        
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

  const drawHull = (ctx, ids, net) => {
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
          if (!currentPoint || 
              Math.abs(currentPoint.x - segment.from.x) > 1e-6 ||
              Math.abs(currentPoint.y - segment.from.y) > 1e-6) {
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

          if (!currentPoint ||
              Math.abs(currentPoint.x - startPoint.x) > 1e-6 ||
              Math.abs(currentPoint.y - startPoint.y) > 1e-6) {
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
          if (!currentPoint ||
              Math.abs(currentPoint.x - segment.from.x) > 1e-6 ||
              Math.abs(currentPoint.y - segment.from.y) > 1e-6) {
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

          if (!currentPoint ||
              Math.abs(currentPoint.x - startPoint.x) > 1e-6 ||
              Math.abs(currentPoint.y - startPoint.y) > 1e-6) {
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
  }

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

    // Initial separation of nodes
    for (let pass = 0; pass < 10; pass++) {
      let movedAny = false
      for (const id of ids) {
        if (pushAway(id, net, ids)) movedAny = true
      }
      if (!movedAny) break
    }

    net.on('beforeDrawing', (ctx) => drawHull(ctx, ids, net))

    // Event listener para click en nodos
    net.on('click', (params) => {
      if (params.nodes.length > 0 && typeof setSelectedNode === 'function') {
        const nodeId = params.nodes[0]
        const position = movedCoordsRef.current[nodeId] || net.getPositions([nodeId])[nodeId]
        
        setSelectedNode(nodeId)
        
        // Convertir coordenadas a valores relativos al NODE_SIZE y invertir Y para el display
        const relativeX = position.x / NODE_SIZE
        const relativeY = -position.y / NODE_SIZE // Invertir Y para el display
        
        if (typeof setNodeCoords === 'function') {
          setNodeCoords({ x: position.x, y: position.y })
        }
        if (typeof setCoordInputs === 'function') {
          setCoordInputs({ 
            x: relativeX.toFixed(2), 
            y: relativeY.toFixed(2) 
          })
        }
      }
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
      
      const allNodeIds = graph.nodes
      
      // Apply repulsion in iterations until stable
      for (let iteration = 0; iteration < 10; iteration++) {
        if (!resolveAllOverlaps(net, allNodeIds)) {
          break
        }
      }
      
      net.redraw()
    })

    return () => net.destroy()
  }, [graph, NODE_SIZE]) // Removemos las funciones de las dependencias

  useEffect(() => {
    showHullRef.current = showHull
    netRef.current?.redraw()
  }, [showHull])

  return { perimeter, hullStats, currentPerimeterRef }
}