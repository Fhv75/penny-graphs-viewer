import React, { useState } from 'react'
import PropTypes from 'prop-types'

export default function RollingControls({
  rollingDisks, // Array de objetos {id, direction}
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
}) {
  const [newDiskDirection, setNewDiskDirection] = useState(1) // CW por defecto

  const handleAddDisk = () => {
    onAddRollingDisk(newDiskDirection)
  }

  return (
    <div className="rolling-controls">
      {/* Selector de disco pivote */}
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

      {/* Selector de discos rodantes */}
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

      {/* Lista de discos rodantes activos */}
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

      {/* Paso en gr  os */}
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
}