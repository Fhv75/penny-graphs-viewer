import parseGraph6 from './parseGraph6'

export default async function loadAllGraphs() {
  const urlDev = `/data/`
  const urlProd = `/penny-graphs-viewer/data/`
  const graphSets = []
  const contactNumbers = [3, 4, 5, 6, 7, 8, 9 ,10] 

  for (const num of contactNumbers) {
    try {
      const url = urlDev + `graphs${num}.txt`
      const txt = await fetch(url).then(r => r.text())
      
      const codes = txt.split(/\s+/).filter(Boolean)
      const graphs = codes.map(parseGraph6)

      graphSets.push({ label: `${num} discos`, graphs })
    } catch (error) {
      console.error(`Error cargando ${url}:`, error)
    }
  }

  try {
    const url = urlDev + 'graphs8_extra.txt'
    const txt = await fetch(url).then(r => r.text())
    
    const codes = txt.split(/\s+/).filter(Boolean)
    const graphs = codes.map(parseGraph6)

    graphSets.push({ label: '11 que faltaban (8 discos) ', graphs })
  } catch (error) {
    console.error(`Error cargando ${url}:`, error)
  }

  return graphSets
}
