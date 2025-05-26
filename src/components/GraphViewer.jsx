// src/components/GraphViewer.jsx
import React, { useEffect, useRef } from 'react'
import { Network }      from 'vis-network'
import { polygonHull }  from 'd3-polygon'

/* ────────── Parámetros globales ────────── */
const NODE_RADIUS = 20                // radio “físico”
const NODE_SIZE   = NODE_RADIUS * 2   // tamaño para vis-network
const SAFE_DIST   = NODE_SIZE * 2

/* ────────── Helpers geométricos ────────── */
const add   = (a,b)=>[a[0]+b[0], a[1]+b[1]]
const sub   = (a,b)=>[a[0]-b[0], a[1]-b[1]]
const mul   = (v,s)=>[v[0]*s   , v[1]*s   ]
const norm  = v => {
  const l = Math.hypot(v[0],v[1]) || 1
  return [v[0]/l, v[1]/l]
}
const angle = (c,p)=>Math.atan2(p[1]-c[1], p[0]-c[0])
const colinear = pts=>{
  if (pts.length < 3) return true
  const [a,b,c] = pts
  return Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])) < 1e-2
}

/* ───────────────────────────────────────── */
export default function GraphViewer({ graph, showHull })
{
  const containerRef = useRef(null)   /* div contenedor           */
  const netRef       = useRef(null)   /* instancia vis-network    */
  const showHullRef  = useRef(showHull) /* valor actual del toggle */

  /* === 1. Crear / recrear red ── SOLO cuando cambie “graph” === */
  useEffect(() => {
    if (!graph) return

    /* destruir red previa si existe */
    if (netRef.current) netRef.current.destroy()

    /* nodos y aristas con layout random */
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

    /* === 1.1. Separación inicial para que no queden superpuestos */
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
    // varias pasadas iniciales
    for (let pass = 0; pass < 10; pass++) {
      let movedAny = false
      for (const id of ids) {
        if (pushAway(id)) movedAny = true
      }
      if (!movedAny) break
    }

    /* === 2. Dibujo del hull =================================== */
    net.on('beforeDrawing', ctx => {
      if (!showHullRef.current) return
      const centers = Object.values(net.getPositions()).map(p=>[p.x,p.y])
      if (!centers.length) return

      ctx.save()
      ctx.fillStyle   = 'rgba(135,206,235,.15)'
      ctx.strokeStyle = 'skyblue'
      ctx.lineWidth   = 2
      ctx.beginPath()

      /* — colineales — */
      if (colinear(centers)) {
        const sorted = [...centers].sort((a,b)=>a[0]-b[0]||a[1]-b[1])
        const A = sorted[0], B = sorted.at(-1)
        const d = norm(sub(B,A)), n = [-d[1],d[0]], r = NODE_SIZE
        const p1 = add(A,mul(n, r)), p2 = add(B,mul(n, r))
        const p3 = add(B,mul(n,-r)), p4 = add(A,mul(n,-r))
        ctx.moveTo(...p1); ctx.lineTo(...p2)
        ctx.arc(B[0],B[1],r, angle(B,p2), angle(B,p3), false)
        ctx.lineTo(...p3); ctx.lineTo(...p4)
        ctx.arc(A[0],A[1],r, angle(A,p4), angle(A,p1), false)
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
        return
      }

      /* — caso general — */
      const hull = polygonHull(centers)
      if (!hull) { ctx.restore(); return }

      const R = NODE_SIZE
      const m = hull.length
      for (let i = 0; i < m; i++) {
        const P  = hull[i]
        const Pm = hull[(i-1+m)%m], Pn = hull[(i+1)%m]
        const nPrev = norm([-(P[1]-Pm[1]), P[0]-Pm[0]])
        const nNext = norm([-(Pn[1]-P[1]), Pn[0]-P[0]])
        const oA = add(P,mul(nPrev,R))
        const oB = add(P,mul(nNext,R))
        if (i===0) ctx.moveTo(...oA); else ctx.lineTo(...oA)
        ctx.arc(P[0],P[1],R, angle(P,oA), angle(P,oB), false)
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
    })

    /* === 3. Colisiones (“anti-overlap”) ======================= */
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
  }, [graph])          /* ← showHull ya no en dependencias */

  /* === 4. Toggle del hull sin recrear red ==================== */
  useEffect(() => {
    showHullRef.current = showHull
    netRef.current?.redraw()
  }, [showHull])

  /* === Render ============================================== */
  return (
    <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
      <div ref={containerRef} style={{flex:1,minHeight:0,border:'1px solid #ccc'}}/>
    </div>
  )
}
