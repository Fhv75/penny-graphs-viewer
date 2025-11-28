export default function HullInfoBar({ 
    perimeter, 
    hullStats, 
    rollingMode, 
    toggleRollingMode,
    showMinimalSearch,
    toggleMinimalSearch,
    isSearching
  }) {
      return (
          <div className="info-bar" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid #ddd',
              fontSize: '14px'
          }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {perimeter !== null && (
                      <span style={{ fontWeight: '500' }}>
                          Perímetro: <strong>{perimeter.toFixed(8)}</strong>
                      </span>
                  )}
                  {hullStats && (
                      <div className="hull-stats" style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          display: 'flex',
                          gap: '12px'
                      }}>
                          <span>Discos: {hullStats.hullDisks}</span>
                          <span>Tangentes: {hullStats.tangentSegments}</span>
                          <span>Arcos: {hullStats.arcSegments}</span>
                      </div>
                  )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                      onClick={toggleMinimalSearch}
                      className={`minimal-search-toggle ${showMinimalSearch ? 'on' : 'off'}`}
                      style={{
                          padding: '8px 12px',
                          backgroundColor: showMinimalSearch ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          display: 'none',
                          alignItems: 'center',
                          gap: '6px'
                      }}
                      disabled={isSearching}
                  >
                      {isSearching ? (
                          <>
                              <div style={{
                                  width: '12px',
                                  height: '12px',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderTop: '2px solid white',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                              }} />
                              Searching...
                          </>
                      ) : (
                          <>
                              🎯 {showMinimalSearch ? 'Hide' : 'Find Minimal'}
                          </>
                      )}
                  </button>
  
                  <button
                      onClick={toggleRollingMode}
                      className={`rolling-toggle ${rollingMode ? 'on' : 'off'}`}
                      style={{
                          padding: '8px 12px',
                          backgroundColor: rollingMode ? '#007bff' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease'
                      }}
                  >
                      {rollingMode ? 'Salir Rolling' : 'Rolling Mode'}
                  </button>
              </div>
  
              <style jsx>{`
                  @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                  }
              `}</style>
          </div>
      );
  }