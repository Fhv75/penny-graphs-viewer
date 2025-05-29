import React, { useEffect, useRef, useState } from 'react'
import { Network } from 'vis-network'
import { quickHullDisks, computePerimeter } from '../utils/quickHullDisk_recursive'

const NODE_RADIUS = 20
const NODE_SIZE   = NODE_RADIUS * 2
const SAFE_DIST   = NODE_SIZE * 2

const add  = (a,b)=>[a[0]+b[0], a[1]+b[1]]
const sub  = (a,b)=>[a[0]-b[0], a[1]-b[1]]
const mul  = (v,s)=>[v[0]*s   , v[1]*s   ]
const norm = v => {
  const l = Math.hypot(v[0],v[1]) || 1
  return [v[0]/l, v[1]/l]
}
const angle = (c,p)=>Math.atan2(p[1]-c[1], p[0]-c[0])
const colinear = pts=>{
  if (pts.length < 3) return true
  const [a,b,c] = pts
  return Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])) < 1e-2
}

export default function GraphViewer({ graph, showHull }) {
  const containerRef = useRef(null)
  const netRef       = useRef(null)
  const showHullRef  = useRef(showHull)
  const [perimeter, setPerimeter] = useState(null)

  useEffect(() => {
    if (!graph) return
    if (netRef.current) netRef.current.destroy()

    const nodes = graph.nodes.map((id,i)=>({
      id,
      label: String(id),
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400
    }))
    const edges = graph.edges.map(([f,t]) => ({ from:f, to:t }))

    const net = new Network(containerRef.current, { nodes, edges }, {
      physics     : false,
      nodes       : { shape:'dot', size:NODE_SIZE, color:'#8fbfff' },
      edges       : { dashes:true, smooth:{type:'cubicBezier',roundness:0.1} },
      interaction : { dragNodes:true, zoomView:true, dragView:true },
      layout      : { improvedLayout: false },
    })
    netRef.current = net

    const ids = graph.nodes
    const pushAway = id => {
      let changed = false
      const pos = net.getPositions([id])[id]
      let { x, y } = pos
      for (const other of ids) {
        if (other === id) continue
        const o = net.getPositions([other])[other]
        let dx = x - o.x, dy = y - o.y
        let dist2 = dx*dx + dy*dy
        if (dist2 === 0) { dx = 0.5; dy = 0; dist2 = dx*dx }
        const dist = Math.sqrt(dist2)
        if (dist < SAFE_DIST) {
          const shift = (SAFE_DIST - dist) / dist
          x += dx*shift; y += dy*shift
          changed = true
        }
      }
      if (changed) net.moveNode(id, x, y)
      return changed
    }
    for (let pass = 0; pass < 10; pass++) {
      let movedAny = false
      for (const id of ids) {
        if (pushAway(id)) movedAny = true
      }
      if (!movedAny) break
    }

    net.on('beforeDrawing', ctx => {
      if (!showHullRef.current) return
      const positions = net.getPositions()
      const disks = Object.values(positions).map(p => ({
        x: p.x,
        y: p.y,
        r: NODE_RADIUS
      }))
      if (disks.length < 2) return

      const hull = quickHullDisks(disks)
      if (!hull.length) return

      const L = computePerimeter(hull)
      setPerimeter(L)

      ctx.save()
      ctx.fillStyle   = 'rgba(135,206,235,.15)'
      ctx.strokeStyle = 'skyblue'
      ctx.lineWidth   = 2

      // Dibuja la envolvente como un único path cerrado (segmentos y arcos)
      let started = false
      hull.forEach(part => {
        if (part.type === 'segment') {
          if (!started) {
            ctx.beginPath()
            ctx.moveTo(part.from.x, part.from.y)
            started = true
          }
          ctx.lineTo(part.to.x, part.to.y)
        } else if (part.type === 'arc') {
          ctx.arc(
            part.center.x, part.center.y, part.radius,
            part.a1, part.a2, false
          )
        }
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    })

    net.on('dragging', e => {
      if (e.nodes.length) pushAway(e.nodes[0])
    })
    net.on('dragEnd', () => {
      for (let k=0; k<5; k++) {
        let moved=false
        for (const id of ids) moved = pushAway(id) || moved
        if (!moved) break
      }
    })

    return () => net.destroy()
  }, [graph])

  useEffect(() => {
    showHullRef.current = showHull
    netRef.current?.redraw()
  }, [showHull])

  return (
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
      <div ref={containerRef} style={{flex:1,minHeight:0,border:'1px solid #ccc'}}/>
      <div style={{ padding: '4px 8px', fontSize: 14, color: '#444' }}>
        {perimeter !== null && `Perímetro: ${perimeter.toFixed(2)}`}
      </div>
    </div>
  )
}
