export default function parseGraph6(code) {
  const bytes = [...code].map(ch => ch.charCodeAt(0) - 63)  
  let index = 0
  let n
  if (bytes[0] <= 62) {          
    n = bytes[0]
    index = 1
  } else {                      
    n = (bytes[1] << 12) | (bytes[2] << 6) | bytes[3]
    index = 4
  }

  const bits = []
  for (let i = index; i < bytes.length; ++i) {
    for (let j = 5; j >= 0; --j) {
      bits.push((bytes[i] >> j) & 1)
    }
  }
  const nodes = Array.from({ length: n }, (_, i) => i)
  const edges = []
  let bitPos = 0
  for (let j = 1; j < n; ++j)           
    for (let i = 0; i < j; ++i) {       
      if (bits[bitPos++]) edges.push([i, j])
    }

  return { nodes, edges }
}
