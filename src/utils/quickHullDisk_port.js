// quickhulldisk_port.js
// Módulo base para calcular la envolvente convexa de discos (QuickhullDisk - versión inicial)

// Representa un disco por su centro y radio
class Disk {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.r = r;
    }
  }
  
  // Verifica si un disco A está completamente contenido en B
  function isContained(A, B) {
    const dx = A.x - B.x;
    const dy = A.y - B.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist + A.r <= B.r;
  }
  
  // Calcula las dos tangentes externas entre dos discos (si no se intersectan o contienen mutuamente)
  function computeExternalTangents(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2);
    const r1 = A.r;
    const r2 = B.r;
  
    if (d < Math.abs(r1 - r2)) return []; // un disco contiene al otro
    if (d < r1 + r2) return []; // se intersectan
  
    const vx = dx / d;
    const vy = dy / d;
    const h = Math.sqrt(d2 - (r1 - r2) * (r1 - r2));
    const rx = -vy * (r1 - r2) / d;
    const ry = vx * (r1 - r2) / d;
  
    const px1 = A.x + vx * r1 + rx * h;
    const py1 = A.y + vy * r1 + ry * h;
    const px2 = A.x + vx * r1 - rx * h;
    const py2 = A.y + vy * r1 - ry * h;
  
    const qx1 = B.x - vx * r2 + rx * h;
    const qy1 = B.y - vy * r2 + ry * h;
    const qx2 = B.x - vx * r2 - rx * h;
    const qy2 = B.y - vy * r2 - ry * h;
  
    return [
      { from: { x: px1, y: py1 }, to: { x: qx1, y: qy1 } },
      { from: { x: px2, y: py2 }, to: { x: qx2, y: qy2 } }
    ];
  }
  
  // TODO: implementar QuickHull adaptado para discos (función recursiva)
  // Por ahora exportamos estructuras básicas para empezar a construir
  
  export { Disk, isContained, computeExternalTangents };
  