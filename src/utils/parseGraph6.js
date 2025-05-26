// src/utils/parseGraph6.js
//
// Convierte una cadena graph6 (p.ej. "CF") -> { nodes: [0,1,2], edges:[[0,1]...] }
export default function parseGraph6(code) {
  // --- 1) decodificar tamaño n ------------------------------------------------
  const bytes = [...code].map(ch => ch.charCodeAt(0) - 63)   // quitar offset 63
  let index = 0
  let n
  if (bytes[0] <= 62) {           // 0..62  -> 1 byte
    n = bytes[0]
    index = 1
  } else {                        // 126 => 4-bytes con n en 18 bits
    // 126 (0x7E) es el marcador; los 3 siguientes bytes codifican n
    n = (bytes[1] << 12) | (bytes[2] << 6) | bytes[3]
    index = 4
  }

  // --- 2) vector de bits ------------------------------------------------------
  const bits = []
  for (let i = index; i < bytes.length; ++i) {
    for (let j = 5; j >= 0; --j) {
      bits.push((bytes[i] >> j) & 1)
    }
  }

  // --- 3) reconstruir aristas (triángulo superior) ----------------------------
  const nodes = Array.from({ length: n }, (_, i) => i)
  const edges = []
  let bitPos = 0
  for (let j = 1; j < n; ++j)           // columna
    for (let i = 0; i < j; ++i) {       // fila
      if (bits[bitPos++]) edges.push([i, j])
    }

  return { nodes, edges }
}
