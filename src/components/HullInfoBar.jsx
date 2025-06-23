export default function HullInfoBar({ perimeter, hullStats, rollingMode, toggleRollingMode }) {
    return (
        <div className="info-bar">
            <div>
                {perimeter !== null && <span>Perímetro: {perimeter.toFixed(8)}</span>}
                {hullStats && (
                    <div className="hull-stats">
                        Discos del Hull: {hullStats.hullDisks} | Tangentes: {hullStats.tangentSegments} | Arcos: {hullStats.arcSegments}
                    </div>
                )}
            </div>
            <button
                onClick={toggleRollingMode}
                className={`rolling-toggle ${rollingMode ? 'on' : 'off'}`}
            >
                {rollingMode ? 'Salir' : 'Rolling Mode'}
            </button>
        </div>
    );
}