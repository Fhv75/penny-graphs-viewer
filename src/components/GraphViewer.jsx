import React, { useEffect, useRef, useState } from 'react'
import { NodeInfoPanel } from './NodeInfoPanel'
import RollingPlot from './RollingPlot'
import HullInfoBar from './HullInfoBar'
import RollingControls from './RollingControls'
import useNetworkSetup from '../hooks/useNetworkSetup'
import useRollingAnimation from '../hooks/useRollingAnimation'
import useNodeSelection from '../hooks/useNodeSelection'
import usePlotData from '../hooks/usePlotData'
import './styles.css'

const NODE_SIZE = 40
const SAFE_DIST = NODE_SIZE

export default function GraphViewer({ graph, showHull }) {
  const containerRef = useRef(null)
  const netRef = useRef(null)
  const movedCoordsRef = useRef({})

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

  const { perimeter, hullStats } = useNetworkSetup(
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
    angleData,
    perimeterData,
    setShowPlot,
    setAngleData,
    setPerimeterData,
    togglePlot,
    clearPlotData
  } = usePlotData()

  const {
    rollingMode,
    rollingDisk,
    anchorDisk,
    rollingDirection,
    stepSize,
    isAnimating,
    currentAngle,
    rollingDiskInput,
    anchorDiskInput,
    setRollingDiskInput,
    setAnchorDiskInput,
    setRollingDirection,
    setStepSize,
    setRollingMode,
    setRollingDisk,
    setAnchorDisk,
    startRolling,
    stopRolling,
    stepRolling,
    resetRollingSelection,
    setRollingDiskFromInput,
    setAnchorDiskFromInput
  } = useRollingAnimation(graph, netRef, movedCoordsRef, NODE_SIZE, perimeter, setAngleData, setPerimeterData)

  // Global keyboard event handling
  useEffect(() => {
    if (selectedNode !== null) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNode, handleKeyDown])

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
          rollingDisk={rollingDisk}
          anchorDisk={anchorDisk}
          rollingDiskInput={rollingDiskInput}
          anchorDiskInput={anchorDiskInput}
          onRollingDiskInputChange={e => setRollingDiskInput(e.target.value)}
          onSetRollingDisk={setRollingDiskFromInput}
          onAnchorDiskInputChange={e => setAnchorDiskInput(e.target.value)}
          onSetAnchorDisk={setAnchorDiskFromInput}
          rollingDirection={rollingDirection}
          onDirectionChange={e => setRollingDirection(parseInt(e.target.value, 10))}
          stepSize={stepSize}
          onStepSizeChange={e => setStepSize(Number(e.target.value))}
          isAnimating={isAnimating}
          onStartStop={() => (isAnimating ? stopRolling() : startRolling())}
          onStep={stepRolling}
          onReset={resetRollingSelection}
          onTogglePlot={togglePlot}
          onClearPlot={clearPlotData}
          showPlot={showPlot}
        />
      )}

      <HullInfoBar 
        perimeter={perimeter}
        hullStats={hullStats}
        rollingMode={rollingMode}
        toggleRollingMode={() => setRollingMode(!rollingMode)}
      />

      <RollingPlot
        angleData={angleData}
        perimeterData={perimeterData}
        isVisible={showPlot}
        onClose={() => setShowPlot(false)}
      />
    </div>
  )
}