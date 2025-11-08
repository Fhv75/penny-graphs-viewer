import React, { useEffect, useRef, useState } from 'react'
import { NodeInfoPanel } from './NodeInfoPanel'
import RollingPlot from './RollingPlot'
import HullInfoBar from './HullInfoBar'
import RollingControls from './RollingControls'
import MinimalPerimeterControls from './MinimalPerimeterControls'
import useNetworkSetup from '../hooks/useNetworkSetup'
import useMultiRollingAnimation from '../hooks/useMultiRollingAnimation'
import useNodeSelection from '../hooks/useNodeSelection'
import usePlotData from '../hooks/usePlotData'
import useMinimalPerimeterSearch from '../hooks/useMinimalPerimeterSearch'
import './styles.css'

const NODE_SIZE = 40
const SAFE_DIST = NODE_SIZE

export default function GraphViewer({ graph, showHull }) {
  const containerRef = useRef(null)
  const netRef = useRef(null)
  const movedCoordsRef = useRef({})

  const [showMinimalSearch, setShowMinimalSearch] = useState(false)

  const {
    selectedNode,
    nodeCoords,
    coordInputs,
    inputErrors,
    setSelectedNode,
    handleCoordChange,
    applyCoordinates,
    handleKeyDown,
    setNodeCoords,
    setCoordInputs
  } = useNodeSelection(netRef, movedCoordsRef, NODE_SIZE)

  const { perimeter, hullStats, currentPerimeterRef } = useNetworkSetup(
    graph,
    showHull,
    containerRef,
    netRef,
    movedCoordsRef,
    NODE_SIZE,
    SAFE_DIST,
    setSelectedNode,
    setNodeCoords,
    setCoordInputs
  )

  const {
    showPlot,
    plotData,
    setShowPlot,
    setPlotData,
    togglePlot,
    clearPlotData
  } = usePlotData()

  const {
    rollingMode,
    rollingDisks,
    anchorDisk,
    stepSize,
    isAnimating,
    currentAngle,
    rollingDiskInput,
    anchorDiskInput,
    stopConfig,           
    setStopConfig,        
    setRollingDiskInput,
    setAnchorDiskInput,
    setStepSize,
    setRollingMode,
    addRollingDisk,
    removeRollingDisk,
    updateRollingDiskDirection,
    setAnchorDisk,
    startRolling,
    stopRolling,
    stepRolling,
    resetRollingSelection,
    setAnchorDiskFromInput
  } = useMultiRollingAnimation(
    graph, 
    netRef, 
    movedCoordsRef, 
    NODE_SIZE, 
    perimeter, 
    setPlotData,
    () => {},
    currentPerimeterRef
  )

  const {
    isSearching,
    searchProgress,
    bestConfiguration,
    searchResults,
    searchParams,
    setSearchParams,
    startBruteForceSearch,
    stopSearch,
    applyBestConfiguration,
    applyConfiguration
  } = useMinimalPerimeterSearch(
    graph,
    netRef,
    movedCoordsRef,
    NODE_SIZE
  )

  useEffect(() => {
    if (selectedNode !== null) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNode, handleKeyDown])

  const handleAddRollingDisk = (direction) => {
    const diskId = parseInt(rollingDiskInput, 10)
    if (!isNaN(diskId)) {
      addRollingDisk(diskId, direction)
      setRollingDiskInput('')
    }
  }

  const toggleMinimalSearch = () => {
    setShowMinimalSearch(!showMinimalSearch)
    if (showMinimalSearch && isSearching) stopSearch()
  }

  return (
    <div className="main-container">
      <div ref={containerRef} className="canvas-container" />

      {selectedNode !== null && (
        <NodeInfoPanel 
          nodeId={selectedNode}
          nodeCoords={nodeCoords}
          coordInputs={coordInputs}
          inputErrors={inputErrors}
          onChange={handleCoordChange}
          onApply={applyCoordinates}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {rollingMode && (
        <RollingControls
          rollingDisks={rollingDisks}
          anchorDisk={anchorDisk}
          rollingDiskInput={rollingDiskInput}
          anchorDiskInput={anchorDiskInput}
          onRollingDiskInputChange={e => setRollingDiskInput(e.target.value)}
          onAddRollingDisk={handleAddRollingDisk}
          onRemoveRollingDisk={removeRollingDisk}
          onUpdateRollingDiskDirection={updateRollingDiskDirection}
          onAnchorDiskInputChange={e => setAnchorDiskInput(e.target.value)}
          onSetAnchorDisk={setAnchorDiskFromInput}
          stepSize={stepSize}
          onStepSizeChange={e => setStepSize(Number(e.target.value))}
          isAnimating={isAnimating}
          onStartStop={() => (isAnimating ? stopRolling() : startRolling())}
          onStep={stepRolling}
          onReset={resetRollingSelection}
          onTogglePlot={togglePlot}
          onClearPlot={clearPlotData}
          showPlot={showPlot}

          stopConfig={stopConfig}
          onStopConfigChange={setStopConfig}
          currentAngle={currentAngle}
        />
      )}

      {showMinimalSearch && (
        <MinimalPerimeterControls
          isSearching={isSearching}
          searchProgress={searchProgress}
          bestConfiguration={bestConfiguration}
          searchResults={searchResults}
          searchParams={searchParams}
          onSearchParamsChange={setSearchParams}
          onStartSearch={startBruteForceSearch}
          onStopSearch={stopSearch}
          onApplyBest={applyBestConfiguration}
          onResultSelect={(result) => { applyConfiguration(result) }}
          currentPerimeter={perimeter}
        />
      )}

      <HullInfoBar 
        perimeter={perimeter}
        hullStats={hullStats}
        rollingMode={rollingMode}
        toggleRollingMode={() => setRollingMode(!rollingMode)}
        showMinimalSearch={showMinimalSearch}
        toggleMinimalSearch={toggleMinimalSearch}
        isSearching={isSearching}
      />

      <RollingPlot
        plotData={plotData}
        isVisible={showPlot}
        onClose={() => setShowPlot(false)}
      />
    </div>
  )
}
