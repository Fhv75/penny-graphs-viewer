import "./styles.css";
export function NodeInfoPanel({
    nodeId,
    nodeCoords,
    coordInputs,
    inputErrors,
    onChange,
    onApply,
    onClose
}) {

    return (
        <div className="node-info">
            <span className="label-bold">Disk {nodeId}:</span>

            {['x','y'].map(axis => (
            <label key={axis} className="input-group">
            {axis.toUpperCase()}:
            <input
                type="text"
                value={coordInputs[axis]}
                onChange={e => onChange(axis, e.target.value)}
                className={`input-text ${inputErrors[axis] ? 'error' : ''}`}
                placeholder={`e.g. 2*cos(45)`}
                onFocus={e => e.target.select()}
                onClick={e => e.target.select()}
            />
            {inputErrors[axis] && <span className="error-icon">!</span>}
            </label>
        ))}

            <button
                onClick={onApply}
                disabled={inputErrors.x || inputErrors.y}
                className={`btn-apply ${inputErrors.x || inputErrors.y ? 'disabled' : ''}`}
            >
                Apply
            </button>
            <button onClick={onClose} className="btn-close">
                ✕
            </button>
            <div className="evaluated">
                Evaluated: X = {nodeCoords.x.toFixed(8)}, Y = {nodeCoords.y.toFixed(8)}
            </div>
        </div>
    );
}