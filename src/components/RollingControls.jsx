// src/components/RollingControls.jsx
import React from 'react'
import PropTypes from 'prop-types'

export default function RollingControls({
  rollingDisk,
  anchorDisk,
  rollingDiskInput,
  anchorDiskInput,
  onRollingDiskInputChange,
  onSetRollingDisk,
  onAnchorDiskInputChange,
  onSetAnchorDisk,
  rollingDirection,
  onDirectionChange,
  stepSize,
  onStepSizeChange,
  isAnimating,
  onStartStop,
  onStep,
  onReset,
  onTogglePlot,
  onClearPlot,
  showPlot,
}) {
  return (
    <div className="rolling-controls">
      {/* Selector de disco rodante 1*/}
      <div className="rolling-section">
        <span>Rolling Disk:</span>
        <input
          type="text"
          placeholder="ID"
          value={rollingDiskInput}
          onChange={onRollingDiskInputChange}
          onKeyPress={e => e.key === 'Enter' && onSetRollingDisk()}
        />
        <button onClick={onSetRollingDisk} className="btn-accept">
          Aceptar
        </button>
        <span className={`status ${rollingDisk != null ? 'active' : ''}`}>
          {rollingDisk ?? 'None'}
        </span>
      </div>

      {/* Selector de pivote */}
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

      {/* Dirección */}
      <div className="rolling-section">
        <label>Dirección:</label>
        <select value={rollingDirection} onChange={onDirectionChange}>
          <option value={-1}>CCW</option>
          <option value={1}>CW</option>
        </select>
      </div>

      {/* Paso en grados */}
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

      {/* Botones de acción */}
      <div className="rolling-actions">
        <button
          onClick={onStep}
          disabled={rollingDisk == null || anchorDisk == null}
          className="btn-step"
        >
          Step
        </button>
        <button
          onClick={onStartStop}
          disabled={rollingDisk == null || anchorDisk == null}
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
  rollingDisk:             PropTypes.number,
  anchorDisk:              PropTypes.number,
  rollingDiskInput:        PropTypes.string.isRequired,
  anchorDiskInput:         PropTypes.string.isRequired,
  onRollingDiskInputChange: PropTypes.func.isRequired,
  onSetRollingDisk:        PropTypes.func.isRequired,
  onAnchorDiskInputChange:  PropTypes.func.isRequired,
  onSetAnchorDisk:         PropTypes.func.isRequired,
  rollingDirection:        PropTypes.oneOf([ -1, 1 ]).isRequired,
  onDirectionChange:       PropTypes.func.isRequired,
  stepSize:                PropTypes.number.isRequired,
  onStepSizeChange:        PropTypes.func.isRequired,
  isAnimating:             PropTypes.bool.isRequired,
  onStartStop:             PropTypes.func.isRequired,
  onStep:                  PropTypes.func.isRequired,
  onReset:                 PropTypes.func.isRequired,
  onTogglePlot:            PropTypes.func.isRequired,
  onClearPlot:             PropTypes.func.isRequired,
  showPlot:                PropTypes.bool.isRequired,
}
