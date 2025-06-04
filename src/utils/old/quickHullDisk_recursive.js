// quickhulldisk_recursive.js
// Parte recursiva adaptada de QuickHull para calcular la envolvente convexa de discos

import { Disk, isContained, computeExternalTangents } from './quickHullDisk_port';

// Verifica si el punto C está a la izquierda de la línea AB
function isLeft(A, B, C) {
  return (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x) > 0;
}

// Distancia de C al segmento AB (para saber cuál está más "fuera")
function distanceToLine(A, B, C) {
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x));
  const base = Math.hypot(B.x - A.x, B.y - A.y);
  return area / base;
}

function quickHullDisks(disks) {
  const filtered = disks.filter(d1 => !disks.some(d2 => d1 !== d2 && isContained(d1, d2)));

  let left = filtered[0], right = filtered[0];
  for (const d of filtered) {
    if (d.x < left.x) left = d;
    if (d.x > right.x) right = d;
  }

  const upper = [];
  const lower = [];
  for (const d of filtered) {
    if (d === left || d === right) continue;
    (isLeft(left, right, d) ? upper : lower).push(d);
  }

  const result = [];
  buildHullSegment(left, right, upper, result);
  buildHullSegment(right, left, lower, result);

  // Añadir arcos entre segmentos consecutivos
  const enhanced = [];
  for (let i = 0; i < result.length; i++) {
    const curr = result[i];
    const next = result[(i + 1) % result.length];

    enhanced.push(curr);

    // Detectar si hay un arco entre el final de uno y el inicio del otro
    if (curr.type === 'segment' && next.type === 'segment') {
      const shared = disks.find(d => {
        const dToStart = Math.hypot(d.x - curr.to.x, d.y - curr.to.y);
        const dToEnd = Math.hypot(d.x - next.from.x, d.y - next.from.y);
        return Math.abs(dToStart - d.r) < 1e-6 && Math.abs(dToEnd - d.r) < 1e-6;
      });
      if (shared) {
        enhanced.push({
          type: 'arc',
          center: { x: shared.x, y: shared.y },
          radius: shared.r,
          from: curr.to,
          to: next.from
        });
      }
    }
  }

  return enhanced;
}

function buildHullSegment(A, B, set, result) {
  if (set.length === 0) {
    result.push({ type: 'segment', from: { x: A.x, y: A.y }, to: { x: B.x, y: B.y } });
    return;
  }

  let maxDist = -1;
  let farthest = null;
  for (const d of set) {
    const dist = distanceToLine(A, B, d);
    if (dist > maxDist) {
      maxDist = dist;
      farthest = d;
    }
  }

  const leftSet = set.filter(d => isLeft(A, farthest, d));
  const rightSet = set.filter(d => isLeft(farthest, B, d));

  buildHullSegment(A, farthest, leftSet, result);
  buildHullSegment(farthest, B, rightSet, result);
}

// Calcula el perímetro total de una envolvente (segmentos + arcos)
function computePerimeter(hull) {
  let total = 0;
  for (const part of hull) {
    if (part.type === 'segment') {
      total += Math.hypot(part.to.x - part.from.x, part.to.y - part.from.y);
    } else if (part.type === 'arc') {
      const a = Math.atan2(part.from.y - part.center.y, part.from.x - part.center.x);
      const b = Math.atan2(part.to.y - part.center.y, part.to.x - part.center.x);
      let angle = b - a;
      if (angle <= 0) angle += 2 * Math.PI;
      total += part.radius * angle;
    }
  }
  return total;
}

export { quickHullDisks, computePerimeter };
