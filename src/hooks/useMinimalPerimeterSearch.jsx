import { useState, useRef, useCallback } from 'react'
import { calculatePerimeter } from '../utils/mathUtils'
import DiskConvexHull from '../algorithms/diskConvexHull/DiskConvexHull'

export default function useMinimalPerimeterSearch(
  graph,
  netRef,
  movedCoordsRef,
  nodeSize
) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  const [bestConfiguration, setBestConfiguration] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchParams, setSearchParams] = useState({
    gridResolution: 10,
    searchRadius: 200,
    maxIterations: 3000,
    temperature: 100.0,
    coolingRate: 0.995,
    perturbationRadius: 25,
    contactConstraints: true, 
    localOptimization: true,
    randomSamples: 5000
  })

  const searchRef = useRef(null)
  const abortRef = useRef(false)

  const isLinearConfiguration = useCallback((positions) => {
    const nodeIds = Object.keys(positions)
    if (nodeIds.length <= 2) return true
    
    const points = nodeIds.map(id => positions[id])
    
    const p1 = points[0]
    const p2 = points[1]
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length < 1e-10) return true
    
    const ux = dx / length
    const uy = dy / length
    
    for (let i = 2; i < points.length; i++) {
      const p = points[i]
      const dpx = p.x - p1.x
      const dpy = p.y - p1.y
      
      const cross = Math.abs(dpx * uy - dpy * ux)
      if (cross > nodeSize * 0.1) { 
        return false
      }
    }
    
    return true
  }, [nodeSize])

  const calculateConfigurationPerimeter = useCallback((positions) => {
    try {
      if (isLinearConfiguration(positions)) {
        return Infinity
      }

      const disks = Object.entries(positions).map(([id, pos]) => ({
        x: pos.x,
        y: pos.y,
        r: nodeSize,
        id: parseInt(id)
      }))

      if (disks.length < 2) return Infinity

      for (let i = 0; i < disks.length; i++) {
        for (let j = i + 1; j < disks.length; j++) {
          const distance = Math.sqrt(
            (disks[i].x - disks[j].x) ** 2 + (disks[i].y - disks[j].y) ** 2
          )
          if (distance < 2 * nodeSize - 1e-8) {
            return Infinity 
          }
        }
      }

      const hullComputer = new DiskConvexHull()
      const result = hullComputer.compute(disks)
      return calculatePerimeter(result.segments, nodeSize)
    } catch (error) {
      console.error('Error calculating perimeter:', error)
      return Infinity
    }
  }, [nodeSize, isLinearConfiguration])

  const generateGridPoints = useCallback((centerX, centerY, radius, resolution) => {
    const points = []
    const step = (2 * radius) / resolution
    
    for (let x = centerX - radius; x <= centerX + radius; x += step) {
      for (let y = centerY - radius; y <= centerY + radius; y += step) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        if (dist <= radius) {
          points.push({ x, y })
        }
      }
    }
    return points
  }, [])

  const perturbConfiguration = useCallback((positions, perturbationRadius) => {
    const newPositions = {}
    
    Object.entries(positions).forEach(([id, pos]) => {
      const angle = Math.random() * 2 * Math.PI
      const distance = Math.random() * perturbationRadius
      
      newPositions[id] = {
        x: pos.x + distance * Math.cos(angle),
        y: pos.y + distance * Math.sin(angle)
      }
    })
    
    return newPositions
  }, [])

  const generateGeometricPatterns = useCallback((nodeIds) => {
    const configurations = []
    const n = nodeIds.length
    const minSpacing = nodeSize * 2.05

    if (n === 2) {
      configurations.push({
        [nodeIds[0]]: { x: -nodeSize, y: 0 },
        [nodeIds[1]]: { x: nodeSize, y: 0 }
      })
    }

    if (n === 3) {
      const spacing = 2 * nodeSize
      const height = spacing * Math.sqrt(3) / 2
      configurations.push({
        [nodeIds[0]]: { x: 0, y: height / 3 },
        [nodeIds[1]]: { x: -spacing / 2, y: -height * 2 / 3 },
        [nodeIds[2]]: { x: spacing / 2, y: -height * 2 / 3 }
      })
    }

    // 2. SKIP LINEAR ARRANGEMENTS - they cause hull bugs and are typically suboptimal
    // (Linear arrangements removed to avoid convex hull computation issues)

    if (n === 4) {
      const spacing = 2 * nodeSize
      configurations.push({
        [nodeIds[0]]: { x: -spacing/2, y: -spacing/2 },
        [nodeIds[1]]: { x: spacing/2, y: -spacing/2 },
        [nodeIds[2]]: { x: spacing/2, y: spacing/2 },
        [nodeIds[3]]: { x: -spacing/2, y: spacing/2 }
      })
      
      configurations.push({
        [nodeIds[0]]: { x: 0, y: -spacing },
        [nodeIds[1]]: { x: -spacing, y: 0 },
        [nodeIds[2]]: { x: 0, y: spacing },
        [nodeIds[3]]: { x: spacing, y: 0 }
      })
    }

    if (n === 5) {
      for (let scale = 1.0; scale <= 1.5; scale += 0.25) {
        const radius = minSpacing * scale
        const pentagonPositions = {}
        for (let i = 0; i < 5; i++) {
          const angle = (2 * Math.PI * i) / 5
          pentagonPositions[nodeIds[i]] = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          }
        }
        configurations.push(pentagonPositions)
      }
    }

    if (n === 6) {
      const spacing = 2 * nodeSize
      configurations.push({
        [nodeIds[0]]: { x: spacing, y: 0 },
        [nodeIds[1]]: { x: spacing/2, y: spacing * Math.sqrt(3)/2 },
        [nodeIds[2]]: { x: -spacing/2, y: spacing * Math.sqrt(3)/2 },
        [nodeIds[3]]: { x: -spacing, y: 0 },
        [nodeIds[4]]: { x: -spacing/2, y: -spacing * Math.sqrt(3)/2 },
        [nodeIds[5]]: { x: spacing/2, y: -spacing * Math.sqrt(3)/2 }
      })
    }

    if (n === 7) {
      const spacing = 2 * nodeSize
      const hexRadius = spacing
      
      configurations.push({
        [nodeIds[0]]: { x: 0, y: 0 }, 
        [nodeIds[1]]: { x: hexRadius, y: 0 },
        [nodeIds[2]]: { x: hexRadius/2, y: hexRadius * Math.sqrt(3)/2 },
        [nodeIds[3]]: { x: -hexRadius/2, y: hexRadius * Math.sqrt(3)/2 },
        [nodeIds[4]]: { x: -hexRadius, y: 0 },
        [nodeIds[5]]: { x: -hexRadius/2, y: -hexRadius * Math.sqrt(3)/2 },
        [nodeIds[6]]: { x: hexRadius/2, y: -hexRadius * Math.sqrt(3)/2 }
      })
      
      for (let scale = 1.1; scale <= 1.3; scale += 0.1) {
        const scaledRadius = hexRadius * scale
        configurations.push({
          [nodeIds[0]]: { x: 0, y: 0 },
          [nodeIds[1]]: { x: scaledRadius, y: 0 },
          [nodeIds[2]]: { x: scaledRadius/2, y: scaledRadius * Math.sqrt(3)/2 },
          [nodeIds[3]]: { x: -scaledRadius/2, y: scaledRadius * Math.sqrt(3)/2 },
          [nodeIds[4]]: { x: -scaledRadius, y: 0 },
          [nodeIds[5]]: { x: -scaledRadius/2, y: -scaledRadius * Math.sqrt(3)/2 },
          [nodeIds[6]]: { x: scaledRadius/2, y: -scaledRadius * Math.sqrt(3)/2 }
        })
      }
    }

    const gridSize = Math.ceil(Math.sqrt(n))
    if (gridSize > 1) { 
      const positions = {}
      let index = 0
      for (let row = 0; row < gridSize && index < n; row++) {
        for (let col = 0; col < gridSize && index < n; col++) {
          const id = nodeIds[index]
          positions[id] = {
            x: (col - (gridSize - 1) / 2) * minSpacing,
            y: (row - (gridSize - 1) / 2) * minSpacing
          }
          index++
        }
      }
      
      if (!isLinearConfiguration(positions)) {
        configurations.push(positions)
      }
    }

    for (let scale = 1.0; scale <= 1.5; scale += 0.25) {
      const hexPositions = {}
      let index = 0
      const spacing = minSpacing * scale
      
      for (let row = 0; row < Math.ceil(Math.sqrt(n)) && index < n; row++) {
        const cols = Math.ceil(n / Math.ceil(Math.sqrt(n)))
        for (let col = 0; col < cols && index < n; col++) {
          const id = nodeIds[index]
          hexPositions[id] = {
            x: col * spacing + (row % 2) * spacing * 0.5,
            y: row * spacing * 0.866
          }
          index++
        }
      }
      
      if (!isLinearConfiguration(hexPositions)) {
        configurations.push(hexPositions)
      }
    }

    for (let radiusMultiplier = 1.0; radiusMultiplier <= 4.0; radiusMultiplier += 0.3) {
      const radius = nodeSize * 2 * radiusMultiplier
      const circlePositions = {}
      nodeIds.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / n
        circlePositions[id] = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        }
      })
      configurations.push(circlePositions)
    }

    if (n >= 4) {
      const centerDisk = nodeIds[0]
      const petalDisks = nodeIds.slice(1)
      
      const touchingRadius = 2 * nodeSize
      const flowerPositions = {}
      flowerPositions[centerDisk] = { x: 0, y: 0 }
      
      petalDisks.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / petalDisks.length
        flowerPositions[id] = {
          x: touchingRadius * Math.cos(angle),
          y: touchingRadius * Math.sin(angle)
        }
      })
      configurations.push(flowerPositions)
      
      for (let petalRadius = touchingRadius * 1.1; petalRadius <= touchingRadius * 1.5; petalRadius += touchingRadius * 0.1) {
        const flowerPositions2 = {}
        flowerPositions2[centerDisk] = { x: 0, y: 0 }
        
        petalDisks.forEach((id, i) => {
          const angle = (2 * Math.PI * i) / petalDisks.length
          flowerPositions2[id] = {
            x: petalRadius * Math.cos(angle),
            y: petalRadius * Math.sin(angle)
          }
        })
        configurations.push(flowerPositions2)
      }
    }

    for (let sides = 3; sides <= Math.min(8, n + 2); sides++) {
      for (let scale = 1.0; scale <= 1.5; scale += 0.25) {
        const polygonPositions = {}
        const radius = minSpacing * sides / (2 * Math.PI) * scale
        
        for (let i = 0; i < Math.min(n, sides); i++) {
          const id = nodeIds[i]
          const angle = (2 * Math.PI * i) / sides
          polygonPositions[id] = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          }
        }
        
        for (let i = sides; i < n; i++) {
          const id = nodeIds[i]
          const innerRadius = radius * 0.6
          const angle = (2 * Math.PI * (i - sides)) / Math.max(1, n - sides)
          polygonPositions[id] = {
            x: innerRadius * Math.cos(angle),
            y: innerRadius * Math.sin(angle)
          }
        }
        
        if (!isLinearConfiguration(polygonPositions)) {
          configurations.push(polygonPositions)
        }
      }
    }

    return configurations
  }, [nodeSize])

  const optimizeContactGraph = useCallback((positions, maxIterations = 100) => {
    let current = { ...positions }
    let improved = true
    let iteration = 0
    
    while (improved && iteration < maxIterations) {
      improved = false
      const nodeIds = Object.keys(current)
      
      for (const nodeId of nodeIds) {
        const currentPos = current[nodeId]
        
        const distances = []
        for (const otherId of nodeIds) {
          if (otherId === nodeId) continue
          const otherPos = current[otherId]
          const dist = Math.sqrt(
            (currentPos.x - otherPos.x) ** 2 + (currentPos.y - otherPos.y) ** 2
          )
          distances.push({ id: otherId, distance: dist, pos: otherPos })
        }
        
        distances.sort((a, b) => a.distance - b.distance)
        
        if (distances.length > 0) {
          const closest = distances[0]
          const targetDistance = 2 * nodeSize
          const currentDistance = closest.distance
          
          if (currentDistance > targetDistance && currentDistance < targetDistance * 1.2) {
            const dx = closest.pos.x - currentPos.x
            const dy = closest.pos.y - currentPos.y
            const length = Math.sqrt(dx * dx + dy * dy)
            
            if (length > 1e-10) {
              const newPos = {
                x: closest.pos.x - (dx / length) * targetDistance,
                y: closest.pos.y - (dy / length) * targetDistance
              }
              
              let validMove = true
              for (const otherId of nodeIds) {
                if (otherId === nodeId || otherId === closest.id) continue
                const otherPos = current[otherId]
                const newDist = Math.sqrt(
                  (newPos.x - otherPos.x) ** 2 + (newPos.y - otherPos.y) ** 2
                )
                if (newDist < targetDistance - 1e-8) {
                  validMove = false
                  break
                }
              }
              
              if (validMove) {
                const originalPerimeter = calculateConfigurationPerimeter(current)
                current[nodeId] = newPos
                const newPerimeter = calculateConfigurationPerimeter(current)
                
                if (newPerimeter <= originalPerimeter * 1.001) { 
                  improved = true
                } else {
                  current[nodeId] = currentPos 
                }
              }
            }
          }
        }
      }
      
      iteration++
    }
    
    return current
  }, [nodeSize, calculateConfigurationPerimeter])

  const gradientOptimization = useCallback((positions, maxIterations = 200) => {
    let current = { ...positions }
    let currentPerimeter = calculateConfigurationPerimeter(current)
    
    const nodeIds = Object.keys(current)
    const stepSize = nodeSize * 0.02
    const minStepSize = nodeSize * 0.001
    let currentStepSize = stepSize
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let bestImprovement = 0
      let bestMove = null
      
      for (const nodeId of nodeIds) {
        const originalPos = current[nodeId]
        
        const directions = [
          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
          { dx: 0.707, dy: 0.707 }, { dx: -0.707, dy: 0.707 }, 
          { dx: 0.707, dy: -0.707 }, { dx: -0.707, dy: -0.707 },
          { dx: 0.5, dy: 0 }, { dx: -0.5, dy: 0 }, { dx: 0, dy: 0.5 }, { dx: 0, dy: -0.5 }
        ]
        
        for (const dir of directions) {
          const newPos = {
            x: originalPos.x + dir.dx * currentStepSize,
            y: originalPos.y + dir.dy * currentStepSize
          }
          
          current[nodeId] = newPos
          const newPerimeter = calculateConfigurationPerimeter(current)
          
          if (newPerimeter < currentPerimeter) {
            const improvement = currentPerimeter - newPerimeter
            if (improvement > bestImprovement) {
              bestImprovement = improvement
              bestMove = { nodeId, newPos: { ...newPos } }
            }
          }
          
          current[nodeId] = originalPos 
        }
      }
      
      if (bestMove) {
        current[bestMove.nodeId] = bestMove.newPos
        currentPerimeter -= bestImprovement
      } else {
        currentStepSize *= 0.8
        if (currentStepSize < minStepSize) break
      }
    }
    
    return { positions: current, perimeter: currentPerimeter }
  }, [nodeSize, calculateConfigurationPerimeter])

  const localOptimization = useCallback((positions, maxSteps = 50) => {
    let current = { ...positions }
    
    const gradientResult = gradientOptimization(current, 100)
    current = gradientResult.positions
    
    current = optimizeContactGraph(current, 50)
    
    const finalResult = gradientOptimization(current, 50)
    
    return finalResult
  }, [gradientOptimization, optimizeContactGraph])

  const exhaustiveGridSearch = useCallback(async (nodeIds, results) => {
    const { gridResolution, searchRadius } = searchParams
    
    if (nodeIds.length > 3) return 
    
    const gridPoints = generateGridPoints(0, 0, searchRadius, gridResolution)
    const totalCombinations = Math.pow(gridPoints.length, nodeIds.length)
    
    if (totalCombinations > 50000) return
    
    let iteration = 0
    
    const searchCombinations = async (positions, nodeIndex) => {
      if (abortRef.current) return
      
      if (nodeIndex >= nodeIds.length) {
        iteration++
        
        if (iteration % 1000 === 0) {
          setSearchProgress(Math.min(20, (iteration / totalCombinations) * 20))
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        const perimeter = calculateConfigurationPerimeter(positions)
        if (perimeter < Infinity) {
          results.push({
            positions: { ...positions },
            perimeter,
            method: 'exhaustive-grid',
            iteration
          })
        }
        return
      }
      
      const nodeId = nodeIds[nodeIndex]
      
      for (const point of gridPoints) {
        if (abortRef.current) return
        positions[nodeId] = { x: point.x, y: point.y }
        await searchCombinations(positions, nodeIndex + 1)
      }
    }
    
    await searchCombinations({}, 0)
  }, [searchParams, generateGridPoints, calculateConfigurationPerimeter])

  const randomSamplingSearch = useCallback(async (nodeIds, results) => {
    const { searchRadius, randomSamples } = searchParams
    
    for (let i = 0; i < randomSamples && !abortRef.current; i++) {
      if (i % 200 === 0) {
        setSearchProgress(20 + (i / randomSamples) * 20)
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      const positions = {}
      nodeIds.forEach(id => {
        const angle = Math.random() * 2 * Math.PI
        const radius = Math.random() * searchRadius
        positions[id] = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        }
      })
      
      const perimeter = calculateConfigurationPerimeter(positions)
      if (perimeter < Infinity) {
        results.push({
          positions: { ...positions },
          perimeter,
          method: 'random-sampling',
          iteration: i
        })
      }
    }
  }, [searchParams, calculateConfigurationPerimeter])

  const trigonometricRollingSearch = useCallback(async (nodeIds, results) => {
    if (nodeIds.length < 3) return 
    
    const configurations = generateGeometricPatterns(nodeIds)
    const bestConfigs = configurations
      .map(config => ({ config, perimeter: calculateConfigurationPerimeter(config) }))
      .filter(item => item.perimeter < Infinity)
      .sort((a, b) => a.perimeter - b.perimeter)
      .slice(0, 3) 
    
    for (const { config } of bestConfigs) {
      if (abortRef.current) break
      
      for (let rollingDiskIdx = 0; rollingDiskIdx < nodeIds.length; rollingDiskIdx++) {
        if (abortRef.current) break
        
        const rollingDiskId = nodeIds[rollingDiskIdx]
        const fixedDisks = nodeIds.filter((_, idx) => idx !== rollingDiskIdx) 
        
        for (const fixedDiskId of fixedDisks) {
          if (abortRef.current) break
          
          const fixedPos = config[fixedDiskId]
          const rollingRadius = 2 * nodeSize 
          
          for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 36) { 
            const newConfig = { ...config }
            newConfig[rollingDiskId] = {
              x: fixedPos.x + rollingRadius * Math.cos(angle),
              y: fixedPos.y + rollingRadius * Math.sin(angle)
            }
            
            const perimeter = calculateConfigurationPerimeter(newConfig)
            if (perimeter < Infinity) {
              const optimized = localOptimization(newConfig, 20)
              
              results.push({
                positions: optimized.positions,
                perimeter: optimized.perimeter,
                method: 'trigonometric-rolling',
                iteration: `${rollingDiskIdx}-${fixedDiskId}-${Math.round(angle * 180 / Math.PI)}deg`
              })
            }
          }
        }
        
        for (let i = 0; i < fixedDisks.length - 1; i++) {
          for (let j = i + 1; j < fixedDisks.length; j++) {
            if (abortRef.current) break
            
            const disk1Id = fixedDisks[i]
            const disk2Id = fixedDisks[j]
            const pos1 = config[disk1Id]
            const pos2 = config[disk2Id]
            
            const midpoint = {
              x: (pos1.x + pos2.x) / 2,
              y: (pos1.y + pos2.y) / 2
            }
            
            const distance = Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2)
            
            if (distance > 4 * nodeSize) {
              const perpAngle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) + Math.PI / 2
              
              for (let offset = -nodeSize * 2; offset <= nodeSize * 2; offset += nodeSize * 0.5) {
                const newConfig = { ...config }
                newConfig[rollingDiskId] = {
                  x: midpoint.x + offset * Math.cos(perpAngle),
                  y: midpoint.y + offset * Math.sin(perpAngle)
                }
                
                const perimeter = calculateConfigurationPerimeter(newConfig)
                if (perimeter < Infinity) {
                  const optimized = localOptimization(newConfig, 20)
                  
                  results.push({
                    positions: optimized.positions,
                    perimeter: optimized.perimeter,
                    method: 'trigonometric-rolling-pair',
                    iteration: `${rollingDiskIdx}-between-${disk1Id}-${disk2Id}`
                  })
                }
              }
            }
          }
        }
      }
    }
    
    setSearchProgress(85)
  }, [generateGeometricPatterns, calculateConfigurationPerimeter, localOptimization])

  const simulatedAnnealingSearch = useCallback(async (nodeIds, initialConfigs, results) => {
    const { maxIterations, temperature: initialTemp, coolingRate, perturbationRadius } = searchParams
    
    for (let configIdx = 0; configIdx < Math.min(initialConfigs.length, 3); configIdx++) {
      if (abortRef.current) break
      
      let currentPositions = { ...initialConfigs[configIdx] }
      let currentPerimeter = calculateConfigurationPerimeter(currentPositions)
      let temperature = initialTemp
      
      for (let i = 0; i < maxIterations && !abortRef.current; i++) {
        if (i % 100 === 0) {
          const progress = 60 + ((configIdx * maxIterations + i) / (3 * maxIterations)) * 20
          setSearchProgress(Math.min(80, progress))
          await new Promise(resolve => setTimeout(resolve, 0))
        }
        
        const newPositions = {}
        Object.entries(currentPositions).forEach(([id, pos]) => {
          let hasContact = false
          Object.entries(currentPositions).forEach(([otherId, otherPos]) => {
            if (id !== otherId) {
              const dist = Math.sqrt((pos.x - otherPos.x)**2 + (pos.y - otherPos.y)**2)
              if (Math.abs(dist - 2 * nodeSize) < nodeSize * 0.1) {
                hasContact = true
              }
            }
          })
          
          const effectiveRadius = hasContact ? 
            perturbationRadius * 0.3 * (temperature / initialTemp) : 
            perturbationRadius * (temperature / initialTemp)
          
          const angle = Math.random() * 2 * Math.PI
          const distance = Math.random() * effectiveRadius
          
          newPositions[id] = {
            x: pos.x + distance * Math.cos(angle),
            y: pos.y + distance * Math.sin(angle)
          }
        })
        
        const newPerimeter = calculateConfigurationPerimeter(newPositions)
        
        const deltaE = newPerimeter - currentPerimeter
        const acceptProbability = deltaE <= 0 ? 1 : Math.exp(-deltaE / temperature)
        
        if (Math.random() < acceptProbability) {
          currentPositions = newPositions
          currentPerimeter = newPerimeter
          
          if (newPerimeter < Infinity) {
            results.push({
              positions: { ...newPositions },
              perimeter: newPerimeter,
              method: `simulated-annealing-contact-${configIdx}`,
              iteration: i,
              startConfig: configIdx
            })
          }
        }
        
        temperature *= coolingRate
        if (temperature < 0.01) break
      }
    }
  }, [searchParams, calculateConfigurationPerimeter])

  const geometricPatternSearch = useCallback(async (nodeIds, results) => {
    const patterns = generateGeometricPatterns(nodeIds)
    
    for (let i = 0; i < patterns.length && !abortRef.current; i++) {
      if (i % 10 === 0) {
        setSearchProgress(70 + (i / patterns.length) * 15)
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      
      const config = patterns[i]
      const perimeter = calculateConfigurationPerimeter(config)
      
      if (perimeter < Infinity) {
        let finalConfig = config
        let finalPerimeter = perimeter
        let method = 'geometric-pattern'
        
        if (searchParams.localOptimization) {
          const optimized = localOptimization(config)
          if (optimized.perimeter < perimeter) {
            finalConfig = optimized.positions
            finalPerimeter = optimized.perimeter
            method = 'geometric-pattern-optimized'
          }
        }
        
        results.push({
          positions: finalConfig,
          perimeter: finalPerimeter,
          method,
          iteration: i
        })
      }
    }
  }, [generateGeometricPatterns, calculateConfigurationPerimeter, searchParams.localOptimization, localOptimization])

  const startBruteForceSearch = useCallback(async () => {
    if (!graph || !netRef.current) return

    setIsSearching(true)
    setSearchProgress(0)
    setSearchResults([])
    setBestConfiguration(null)
    abortRef.current = false

    const nodeIds = graph.nodes
    const results = []

    try {
      console.log(`Starting comprehensive minimal perimeter search for ${nodeIds.length} disks`)

      if (nodeIds.length <= 3) {
        await exhaustiveGridSearch(nodeIds, results)
      }

      await randomSamplingSearch(nodeIds, results)

      await geometricPatternSearch(nodeIds, results)

      await trigonometricRollingSearch(nodeIds, results)

      const initialConfigs = generateGeometricPatterns(nodeIds)
      await simulatedAnnealingSearch(nodeIds, initialConfigs, results)

      setSearchProgress(90)
      
      results.sort((a, b) => a.perimeter - b.perimeter)
      
      const uniqueResults = []
      for (const result of results) {
        const isDuplicate = uniqueResults.some(existing => 
          Math.abs(existing.perimeter - result.perimeter) < 1e-10
        )
        if (!isDuplicate && uniqueResults.length < 100) {
          uniqueResults.push(result)
        }
      }
      
      setSearchResults(uniqueResults)
      
      if (uniqueResults.length > 0) {
        setBestConfiguration(uniqueResults[0])
        console.log(`Search complete! Found ${uniqueResults.length} unique configurations`)
        console.log(`Best perimeter: ${uniqueResults[0].perimeter.toFixed(12)} (method: ${uniqueResults[0].method})`)
        
        const methods = [...new Set(uniqueResults.map(r => r.method))]
        console.log(`Methods used: ${methods.join(', ')}`)
      }

    } catch (error) {
      console.error('Search error:', error)
    }

    setIsSearching(false)
    setSearchProgress(100)
  }, [
    graph, 
    exhaustiveGridSearch,
    randomSamplingSearch,
    geometricPatternSearch,
    trigonometricRollingSearch,
    simulatedAnnealingSearch,
    generateGeometricPatterns
  ])

  const applyConfiguration = useCallback((configuration) => {
    if (!configuration || !netRef.current) return
    
    Object.entries(configuration.positions).forEach(([id, pos]) => {
      netRef.current.moveNode(parseInt(id), pos.x, pos.y)
      movedCoordsRef.current[parseInt(id)] = { x: pos.x, y: pos.y }
    })
    
    netRef.current.redraw()
  }, [])

  const stopSearch = useCallback(() => {
    abortRef.current = true
    setIsSearching(false)
  }, [])

  return {
    isSearching,
    searchProgress,
    bestConfiguration,
    searchResults,
    searchParams,
    setSearchParams,
    startBruteForceSearch,
    stopSearch,
    applyBestConfiguration: () => applyConfiguration(bestConfiguration),
    applyConfiguration
  }
}