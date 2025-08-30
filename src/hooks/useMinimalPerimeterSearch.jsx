// hooks/useMinimalPerimeterSearch.js - FIXED VERSION
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
    contactConstraints: true,  // Consider touching, but don't force it
    localOptimization: true,
    randomSamples: 5000
  })

  const searchRef = useRef(null)
  const abortRef = useRef(false)

  // Check if configuration is linear (to filter out problematic cases) - MOVED TO TOP
  const isLinearConfiguration = useCallback((positions) => {
    const nodeIds = Object.keys(positions)
    if (nodeIds.length <= 2) return true
    
    const points = nodeIds.map(id => positions[id])
    
    // Check if all points are approximately collinear
    const p1 = points[0]
    const p2 = points[1]
    
    // Vector from p1 to p2
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length < 1e-10) return true // Points are too close
    
    // Unit vector
    const ux = dx / length
    const uy = dy / length
    
    // Check if all other points lie on the same line
    for (let i = 2; i < points.length; i++) {
      const p = points[i]
      const dpx = p.x - p1.x
      const dpy = p.y - p1.y
      
      // Cross product to check if point is on line
      const cross = Math.abs(dpx * uy - dpy * ux)
      if (cross > nodeSize * 0.1) { // Allow small tolerance
        return false
      }
    }
    
    return true
  }, [nodeSize])

  // Calculate perimeter for a given configuration - with linear filtering
  const calculateConfigurationPerimeter = useCallback((positions) => {
    try {
      // Filter out linear configurations to avoid hull computation bugs
      if (isLinearConfiguration(positions)) {
        return Infinity // Linear configurations typically have poor perimeters anyway
      }

      const disks = Object.entries(positions).map(([id, pos]) => ({
        x: pos.x,
        y: pos.y,
        r: nodeSize,
        id: parseInt(id)
      }))

      if (disks.length < 2) return Infinity

      // Check for overlaps (strict constraint)
      for (let i = 0; i < disks.length; i++) {
        for (let j = i + 1; j < disks.length; j++) {
          const distance = Math.sqrt(
            (disks[i].x - disks[j].x) ** 2 + (disks[i].y - disks[j].y) ** 2
          )
          if (distance < 2 * nodeSize - 1e-8) {
            return Infinity // Overlapping disks
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

  // Generate grid points within a region
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

  // Generate random perturbation
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

  // Check if configuration is linear (to filter out problematic cases) - REMOVED DUPLICATE

  // Generate diverse geometric patterns - IMPROVED
  const generateGeometricPatterns = useCallback((nodeIds) => {
    const configurations = []
    const n = nodeIds.length
    const minSpacing = nodeSize * 2.05

    // 1. TOUCHING CONFIGURATIONS (when they make sense)
    if (n === 2) {
      // Two disks touching
      configurations.push({
        [nodeIds[0]]: { x: -nodeSize, y: 0 },
        [nodeIds[1]]: { x: nodeSize, y: 0 }
      })
    }

    if (n === 3) {
      // Equilateral triangle - touching
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

    // 3. OPTIMAL PACKING PATTERNS for specific numbers
    if (n === 4) {
      // Square arrangement (touching corners)
      const spacing = 2 * nodeSize
      configurations.push({
        [nodeIds[0]]: { x: -spacing/2, y: -spacing/2 },
        [nodeIds[1]]: { x: spacing/2, y: -spacing/2 },
        [nodeIds[2]]: { x: spacing/2, y: spacing/2 },
        [nodeIds[3]]: { x: -spacing/2, y: spacing/2 }
      })
      
      // Diamond arrangement
      configurations.push({
        [nodeIds[0]]: { x: 0, y: -spacing },
        [nodeIds[1]]: { x: -spacing, y: 0 },
        [nodeIds[2]]: { x: 0, y: spacing },
        [nodeIds[3]]: { x: spacing, y: 0 }
      })
    }

    if (n === 5) {
      // Pentagon arrangement
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
      // Perfect hexagon - touching
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
      // CRITICAL: Hexagon + center (optimal 7-disk packing)
      const spacing = 2 * nodeSize
      const hexRadius = spacing
      
      // Hexagon with center
      configurations.push({
        [nodeIds[0]]: { x: 0, y: 0 }, // Center disk
        [nodeIds[1]]: { x: hexRadius, y: 0 },
        [nodeIds[2]]: { x: hexRadius/2, y: hexRadius * Math.sqrt(3)/2 },
        [nodeIds[3]]: { x: -hexRadius/2, y: hexRadius * Math.sqrt(3)/2 },
        [nodeIds[4]]: { x: -hexRadius, y: 0 },
        [nodeIds[5]]: { x: -hexRadius/2, y: -hexRadius * Math.sqrt(3)/2 },
        [nodeIds[6]]: { x: hexRadius/2, y: -hexRadius * Math.sqrt(3)/2 }
      })
      
      // Also try slightly larger hexagon + center
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

    // 4. GENERAL GRID ARRANGEMENTS (avoid linear)
    const gridSize = Math.ceil(Math.sqrt(n))
    if (gridSize > 1) { // Avoid 1xN linear grids
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
      
      // Only add if not essentially linear
      if (!isLinearConfiguration(positions)) {
        configurations.push(positions)
      }
    }

    // 5. HEXAGONAL PACKING (multiple scales)
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

    // 6. CIRCULAR ARRANGEMENTS (various radii)
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

    // 7. FLOWER/STAR PATTERNS (center + petals) - with contact optimization
    if (n >= 4) {
      const centerDisk = nodeIds[0]
      const petalDisks = nodeIds.slice(1)
      
      // Try exact touching distance first
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
      
      // Try slightly larger radii as well
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

    // 8. POLYGON ARRANGEMENTS (triangular, square, pentagonal layouts)
    for (let sides = 3; sides <= Math.min(8, n + 2); sides++) {
      for (let scale = 1.0; scale <= 1.5; scale += 0.25) {
        const polygonPositions = {}
        const radius = minSpacing * sides / (2 * Math.PI) * scale
        
        // Place disks around polygon vertices first
        for (let i = 0; i < Math.min(n, sides); i++) {
          const id = nodeIds[i]
          const angle = (2 * Math.PI * i) / sides
          polygonPositions[id] = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          }
        }
        
        // Place remaining disks inside or in second ring
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

  // NEW: Contact graph optimization - ensure meaningful contacts
  const optimizeContactGraph = useCallback((positions, maxIterations = 100) => {
    let current = { ...positions }
    let improved = true
    let iteration = 0
    
    while (improved && iteration < maxIterations) {
      improved = false
      const nodeIds = Object.keys(current)
      
      // For each disk, try to establish contacts that improve the configuration
      for (const nodeId of nodeIds) {
        const currentPos = current[nodeId]
        
        // Find closest disks to this one
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
        
        // Try to establish contact with closest disk if not touching and close enough
        if (distances.length > 0) {
          const closest = distances[0]
          const targetDistance = 2 * nodeSize
          const currentDistance = closest.distance
          
          // If very close but not touching, snap to contact
          if (currentDistance > targetDistance && currentDistance < targetDistance * 1.2) {
            const dx = closest.pos.x - currentPos.x
            const dy = closest.pos.y - currentPos.y
            const length = Math.sqrt(dx * dx + dy * dy)
            
            if (length > 1e-10) {
              const newPos = {
                x: closest.pos.x - (dx / length) * targetDistance,
                y: closest.pos.y - (dy / length) * targetDistance
              }
              
              // Check if this new position doesn't cause overlaps
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
                
                if (newPerimeter <= originalPerimeter * 1.001) { // Allow tiny increase for contact
                  improved = true
                } else {
                  current[nodeId] = currentPos // Revert
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

  // NEW: Gradient-based local optimization (your suggestion!)
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
      
      // Try moving each disk in cardinal and diagonal directions
      for (const nodeId of nodeIds) {
        const originalPos = current[nodeId]
        
        // 8 directions + 4 smaller diagonal steps
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
          
          current[nodeId] = originalPos // Restore
        }
      }
      
      // Apply best move if found
      if (bestMove) {
        current[bestMove.nodeId] = bestMove.newPos
        currentPerimeter -= bestImprovement
      } else {
        // If no improvement, reduce step size
        currentStepSize *= 0.8
        if (currentStepSize < minStepSize) break
      }
    }
    
    return { positions: current, perimeter: currentPerimeter }
  }, [nodeSize, calculateConfigurationPerimeter])

  // Enhanced local optimization with contact awareness
  const localOptimization = useCallback((positions, maxSteps = 50) => {
    let current = { ...positions }
    
    // First, apply gradient optimization
    const gradientResult = gradientOptimization(current, 100)
    current = gradientResult.positions
    
    // Then, optimize contact graph
    current = optimizeContactGraph(current, 50)
    
    // Final gradient polish
    const finalResult = gradientOptimization(current, 50)
    
    return finalResult
  }, [gradientOptimization, optimizeContactGraph])

  // Exhaustive grid search for small configurations
  const exhaustiveGridSearch = useCallback(async (nodeIds, results) => {
    const { gridResolution, searchRadius } = searchParams
    
    if (nodeIds.length > 3) return // Only for very small configurations
    
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

  // Random sampling search
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

  // NEW: Trigonometric rolling optimization (your brute force idea!) - FIXED SCOPE ERROR
  const trigonometricRollingSearch = useCallback(async (nodeIds, results) => {
    if (nodeIds.length < 3) return // Need at least 3 for meaningful rolling
    
    const configurations = generateGeometricPatterns(nodeIds)
    const bestConfigs = configurations
      .map(config => ({ config, perimeter: calculateConfigurationPerimeter(config) }))
      .filter(item => item.perimeter < Infinity)
      .sort((a, b) => a.perimeter - b.perimeter)
      .slice(0, 3) // Take top 3 as starting points
    
    for (const { config } of bestConfigs) {
      if (abortRef.current) break
      
      // Try rolling each disk around others
      for (let rollingDiskIdx = 0; rollingDiskIdx < nodeIds.length; rollingDiskIdx++) {
        if (abortRef.current) break
        
        const rollingDiskId = nodeIds[rollingDiskIdx]
        const fixedDisks = nodeIds.filter((_, idx) => idx !== rollingDiskIdx) // FIXED: Properly define fixedDisks
        
        // For each fixed disk, try rolling the selected disk around it
        for (const fixedDiskId of fixedDisks) {
          if (abortRef.current) break
          
          const fixedPos = config[fixedDiskId]
          const rollingRadius = 2 * nodeSize // Touching distance
          
          // Try different angles around the fixed disk
          for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 36) { // 5-degree steps
            const newConfig = { ...config }
            newConfig[rollingDiskId] = {
              x: fixedPos.x + rollingRadius * Math.cos(angle),
              y: fixedPos.y + rollingRadius * Math.sin(angle)
            }
            
            const perimeter = calculateConfigurationPerimeter(newConfig)
            if (perimeter < Infinity) {
              // Apply local optimization to this configuration
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
        
        // Also try rolling around pairs of disks (finding optimal positions between them)
        for (let i = 0; i < fixedDisks.length - 1; i++) {
          for (let j = i + 1; j < fixedDisks.length; j++) {
            if (abortRef.current) break
            
            const disk1Id = fixedDisks[i]
            const disk2Id = fixedDisks[j]
            const pos1 = config[disk1Id]
            const pos2 = config[disk2Id]
            
            // Find points that are equidistant from both disks
            const midpoint = {
              x: (pos1.x + pos2.x) / 2,
              y: (pos1.y + pos2.y) / 2
            }
            
            const distance = Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2)
            
            if (distance > 4 * nodeSize) { // Only if there's room between them
              // Try positions along the perpendicular bisector
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

  // Enhanced simulated annealing with contact-aware moves
  const simulatedAnnealingSearch = useCallback(async (nodeIds, initialConfigs, results) => {
    const { maxIterations, temperature: initialTemp, coolingRate, perturbationRadius } = searchParams
    
    // Run SA from multiple starting configurations
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
        
        // Enhanced perturbation that considers contact relationships
        const newPositions = {}
        Object.entries(currentPositions).forEach(([id, pos]) => {
          // Check if this disk is in contact with others
          let hasContact = false
          Object.entries(currentPositions).forEach(([otherId, otherPos]) => {
            if (id !== otherId) {
              const dist = Math.sqrt((pos.x - otherPos.x)**2 + (pos.y - otherPos.y)**2)
              if (Math.abs(dist - 2 * nodeSize) < nodeSize * 0.1) {
                hasContact = true
              }
            }
          })
          
          // Use smaller perturbations for disks that have contacts
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

  // Geometric pattern search
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
        
        // Apply local optimization if enabled
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

  // Main search function
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

      // Strategy 1: Exhaustive search for small configurations
      if (nodeIds.length <= 3) {
        await exhaustiveGridSearch(nodeIds, results)
      }

      // Strategy 2: Random sampling
      await randomSamplingSearch(nodeIds, results)

      // Strategy 3: Geometric patterns
      await geometricPatternSearch(nodeIds, results)

      // Strategy 4: Trigonometric rolling optimization (your brute force idea!)
      await trigonometricRollingSearch(nodeIds, results)

      // Strategy 5: Simulated annealing from best patterns found so far
      const initialConfigs = generateGeometricPatterns(nodeIds)
      await simulatedAnnealingSearch(nodeIds, initialConfigs, results)

      // Final processing
      setSearchProgress(90)
      
      // Sort and deduplicate results
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
        
        // Log method diversity
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

  // Apply configuration to visualization
  const applyConfiguration = useCallback((configuration) => {
    if (!configuration || !netRef.current) return
    
    Object.entries(configuration.positions).forEach(([id, pos]) => {
      netRef.current.moveNode(parseInt(id), pos.x, pos.y)
      movedCoordsRef.current[parseInt(id)] = { x: pos.x, y: pos.y }
    })
    
    netRef.current.redraw()
  }, [])

  // Stop search
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