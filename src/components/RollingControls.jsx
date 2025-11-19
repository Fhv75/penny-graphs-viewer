import React, { useState } from 'react'
import PropTypes from 'prop-types'

export default function RollingControls({
  rollingDisks,
  anchorDisk,
  rollingDiskInput,
  anchorDiskInput,
  onRollingDiskInputChange,
  onAddRollingDisk,
  onRemoveRollingDisk,
  onUpdateRollingDiskDirection,
  onAnchorDiskInputChange,
  onSetAnchorDisk,
  stepSize,
  onStepSizeChange,
  isAnimating,
  onStartStop,
  onStep,
  onReset,
  onTogglePlot,
  onClearPlot,
  showPlot,
  stopConfig,
  onStopConfigChange,
  currentAngle,
}) {
  const [newDiskDirection, setNewDiskDirection] = useState(1)

  const handleAddDisk = () => {
    onAddRollingDisk(newDiskDirection)
  }

  const setStopMode = (mode) => {
    onStopConfigChange(prev => ({ ...prev, mode }))
  }
  const setAngleDeg = (val) => {
    const n = Number(val)
    onStopConfigChange(prev => ({ ...prev, angleDeg: Number.isFinite(n) ? n : prev.angleDeg }))
  }
  const setRegion = (patch) => {
    onStopConfigChange(prev => ({ ...prev, region: { ...prev.region, ...patch } }))
  }

  return (
    <div className="rolling-controls">
      <div className="rolling-section">
        <span>Pivote:</span>
        <input
          type="text"
          placeholder="ID"
          value={anchorDiskInput}
          onChange={onAnchorDiskInputChange}
          onKeyPress={e => e.key === 'Enter' && onSetAnchorDisk()}
        />
        <button onClick={onSetAnchorDisk} className="btn-accept">
          Aceptar
        </button>
        <span className={`status ${anchorDisk != null ? 'anchor-active' : ''}`}>
          {anchorDisk ?? 'None'}
        </span>
      </div>

      <div className="rolling-section">
        <span>Add Rolling Disk:</span>
        <input
          type="text"
          placeholder="ID"
          value={rollingDiskInput}
          onChange={onRollingDiskInputChange}
          onKeyPress={e => e.key === 'Enter' && handleAddDisk()}
        />
        <select 
          value={newDiskDirection} 
          onChange={e => setNewDiskDirection(parseInt(e.target.value, 10))}
        >
          <option value={-1}>CCW</option>
          <option value={1}>CW</option>
        </select>
        <button onClick={handleAddDisk} className="btn-accept">
          Add
        </button>
      </div>

      {rollingDisks.length > 0 && (
        <div className="rolling-disks-list">
          <span>Rolling Disks:</span>
          <div className="disks-container">
            {rollingDisks.map((disk, index) => (
              <div key={index} className="disk-item">
                <span className="disk-id">#{disk.id}</span>
                <select 
                  value={disk.direction}
                  onChange={e => onUpdateRollingDiskDirection(index, parseInt(e.target.value, 10))}
                  className="direction-select"
                >
                  <option value={-1}>CCW</option>
                  <option value={1}>CW</option>
                </select>
                <button 
                  onClick={() => onRemoveRollingDisk(index)}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rolling-section">
        <label>Step (°):</label>
        <input
          type="number"
          min="1"
          max="90"
          value={stepSize}
          onChange={onStepSizeChange}
        />
      </div>

      <div className="rolling-section">
        <label>Stop:</label>
        <select
          value={stopConfig.mode}
          onChange={e => setStopMode(e.target.value)}
        >
          <option value="none">None</option>
          <option value="angle">Swept Angle</option>
          <option value="region">Region (X/Y)</option>
        </select>

        {stopConfig.mode === 'angle' && (
          <>
            <label>Target (°):</label>
            <input
              type="number"
              min="0"
              value={stopConfig.angleDeg}
              onChange={e => setAngleDeg(e.target.value)}
            />
            <span className="status">θ = {Number(currentAngle || 0).toFixed(2)}°</span>
          </>
        )}

        {stopConfig.mode === 'region' && (
          <div className="stop-region">
            <span>X:</span>
            <select
              value={stopConfig.region.cmpX}
              onChange={e => setRegion({ cmpX: e.target.value })}
            >
              <option value=">=">{'\u2265'}</option>
              <option value="<=">{'\u2264'}</option>
            </select>
            <input
              type="number"
              placeholder="x*"
              value={stopConfig.region.x ?? ''}
              onChange={e => setRegion({ x: e.target.value === '' ? null : Number(e.target.value) })}
            />

            <span>Y:</span>
            <select
              value={stopConfig.region.cmpY}
              onChange={e => setRegion({ cmpY: e.target.value })}
            >
              <option value=">=">{'\u2265'}</option>
              <option value="<=">{'\u2264'}</option>
            </select>
            <input
              type="number"
              placeholder="y*"
              value={stopConfig.region.y ?? ''}
              onChange={e => setRegion({ y: e.target.value === '' ? null : Number(e.target.value) })}
            />

            <span>ε:</span>
            <input
              type="number"
              step="0.1"
              value={stopConfig.region.eps}
              onChange={e => setRegion({ eps: Number(e.target.value) })}
              title="Tolerancia para las comparaciones"
            />
          </div>
        )}
      </div>

      <div className="rolling-actions">
        <button
          onClick={onStep}
          disabled={rollingDisks.length === 0 || anchorDisk == null}
          className="btn-step"
        >
          Step
        </button>
        <button
          onClick={onStartStop}
          disabled={rollingDisks.length === 0 || anchorDisk == null}
          className="btn-start"
        >
          {isAnimating ? 'Stop' : 'Start'}
        </button>
        <button onClick={onReset} className="btn-reset">
          Reset
        </button>
        <button onClick={onTogglePlot} className="btn-plot">
          {showPlot ? 'Hide Plot' : 'Show Plot'}
        </button>
        <button onClick={onClearPlot} className="btn-clear">
          Clear Plot
        </button>
      </div>
    </div>
  )
}

RollingControls.propTypes = {
  rollingDisks:             PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    direction: PropTypes.oneOf([-1, 1]).isRequired
  })).isRequired,
  anchorDisk:              PropTypes.number,
  rollingDiskInput:        PropTypes.string.isRequired,
  anchorDiskInput:         PropTypes.string.isRequired,
  onRollingDiskInputChange: PropTypes.func.isRequired,
  onAddRollingDisk:        PropTypes.func.isRequired,
  onRemoveRollingDisk:     PropTypes.func.isRequired,
  onUpdateRollingDiskDirection: PropTypes.func.isRequired,
  onAnchorDiskInputChange:  PropTypes.func.isRequired,
  onSetAnchorDisk:         PropTypes.func.isRequired,
  stepSize:                PropTypes.number.isRequired,
  onStepSizeChange:        PropTypes.func.isRequired,
  isAnimating:             PropTypes.bool.isRequired,
  onStartStop:             PropTypes.func.isRequired,
  onStep:                  PropTypes.func.isRequired,
  onReset:                 PropTypes.func.isRequired,
  onTogglePlot:            PropTypes.func.isRequired,
  onClearPlot:             PropTypes.func.isRequired,
  showPlot:                PropTypes.bool.isRequired,

  stopConfig:              PropTypes.shape({
    mode:      PropTypes.oneOf(['none','angle','region']).isRequired,
    angleDeg:  PropTypes.number,
    region:    PropTypes.shape({
      x:    PropTypes.number,
      cmpX: PropTypes.oneOf(['>=','<=']),
      y:    PropTypes.number,
      cmpY: PropTypes.oneOf(['>=','<=']),
      eps:  PropTypes.number,
    })
  }).isRequired,
  onStopConfigChange:      PropTypes.func.isRequired,
  currentAngle:            PropTypes.number,
}
