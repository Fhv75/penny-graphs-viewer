import React, { useState } from 'react'

export default function MinimalPerimeterControls({
  isSearching,
  searchProgress,
  bestConfiguration,
  searchResults,
  searchParams,
  onSearchParamsChange,
  onStartSearch,
  onStopSearch,
  onApplyBest,
  onResultSelect,
  currentPerimeter
}) {
  const [showResults, setShowResults] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const improvement = bestConfiguration && currentPerimeter ? 
    ((currentPerimeter - bestConfiguration.perimeter) / currentPerimeter * 100) : 0

  const resultsByMethod = searchResults.reduce((acc, result) => {
    const method = result.method
    if (!acc[method]) acc[method] = []
    acc[method].push(result)
    return acc
  }, {})

  const exportResults = () => {
    const data = {
      searchParams,
      timestamp: new Date().toISOString(),
      totalConfigurations: searchResults.length,
      bestConfiguration,
      currentPerimeter,
      improvement,
      resultsByMethod: Object.entries(resultsByMethod).map(([method, results]) => ({
        method,
        count: results.length,
        bestPerimeter: Math.min(...results.map(r => r.perimeter)),
        averagePerimeter: results.reduce((sum, r) => sum + r.perimeter, 0) / results.length,
        results: results.slice(0, 10)  
      })),
      allResults: searchResults.slice(0, 50) 
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `minimal_perimeter_search_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="minimal-perimeter-controls" style={{
      position: 'absolute',
      top: '120px',
      right: '20px',
      width: '380px',
      background: 'rgba(255, 255, 255, 0.98)',
      border: '2px solid #2196F3',
      borderRadius: '12px',
      padding: '20px',
      fontSize: '14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: '#1976D2',
        fontSize: '18px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Minimal Perimeter Research
      </h3>
      
      {/* Current State Display */}
      <div style={{
        background: '#f8f9fa',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Current Configuration</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          Perimeter: {currentPerimeter ? currentPerimeter.toFixed(8) : 'N/A'}
        </div>
        {bestConfiguration && (
          <div style={{ fontSize: '12px', color: improvement > 0 ? '#28a745' : '#6c757d', marginTop: '4px' }}>
            Best found: {bestConfiguration.perimeter.toFixed(8)} 
            {improvement > 0 && (
              <span style={{ color: '#28a745', fontWeight: '600' }}>
                {' '}(-{improvement.toFixed(2)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search Controls */}
      <div style={{ marginBottom: '16px' }}>
        {!isSearching ? (
          <button
            onClick={onStartSearch}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={e => e.target.style.backgroundColor = '#28a745'}
          >
             Start Search
          </button>
        ) : (
          <div>
            <button
              onClick={onStopSearch}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px'
              }}
            >
              ⏹️ Stop Search
            </button>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: '#e9ecef',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${searchProgress}%`,
                  height: '100%',
                  backgroundColor: searchProgress < 50 ? '#ffc107' : searchProgress < 80 ? '#17a2b8' : '#28a745',
                  transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>
              <div style={{ 
                textAlign: 'center', 
                marginTop: '6px', 
                fontSize: '12px',
                color: '#6c757d'
              }}>
                {searchProgress.toFixed(1)}% Complete
                {searchResults.length > 0 && ` • ${searchResults.length} configs tested`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Parameters */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6c757d',
            cursor: 'pointer',
            fontSize: '13px',
            textDecoration: 'underline',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {showAdvanced ? '▼' : '▶'} Algorithm Parameters
        </button>
        
        {showAdvanced && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '12px',
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            {/* Algorithm Selection */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
                Algorithm Selection
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '6px',
                fontSize: '12px'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={searchParams.enabledAlgorithms?.exhaustiveGrid ?? true}
                    onChange={e => onSearchParamsChange({
                      ...searchParams,
                      enabledAlgorithms: {
                        ...searchParams.enabledAlgorithms,
                        exhaustiveGrid: e.target.checked
                      }
                    })}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Grid Search
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={searchParams.enabledAlgorithms?.randomSampling ?? true}
                    onChange={e => onSearchParamsChange({
                      ...searchParams,
                      enabledAlgorithms: {
                        ...searchParams.enabledAlgorithms,
                        randomSampling: e.target.checked
                      }
                    })}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Random Sampling
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={searchParams.enabledAlgorithms?.geometricPatterns ?? true}
                    onChange={e => onSearchParamsChange({
                      ...searchParams,
                      enabledAlgorithms: {
                        ...searchParams.enabledAlgorithms,
                        geometricPatterns: e.target.checked
                      }
                    })}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Geometric Patterns
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={searchParams.enabledAlgorithms?.trigonometricRolling ?? true}
                    onChange={e => onSearchParamsChange({
                      ...searchParams,
                      enabledAlgorithms: {
                        ...searchParams.enabledAlgorithms,
                        trigonometricRolling: e.target.checked
                      }
                    })}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Trigonometric Rolling
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  gridColumn: '1 / -1'
                }}>
                  <input
                    type="checkbox"
                    checked={searchParams.enabledAlgorithms?.simulatedAnnealing ?? true}
                    onChange={e => onSearchParamsChange({
                      ...searchParams,
                      enabledAlgorithms: {
                        ...searchParams.enabledAlgorithms,
                        simulatedAnnealing: e.target.checked
                      }
                    })}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  Simulated Annealing
                </label>
              </div>
              
              {/* Quick selection buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginTop: '8px', 
                flexWrap: 'wrap' 
              }}>
                <button
                  onClick={() => onSearchParamsChange({
                    ...searchParams,
                    enabledAlgorithms: {
                      exhaustiveGrid: true,
                      randomSampling: true,
                      geometricPatterns: true,
                      trigonometricRolling: true,
                      simulatedAnnealing: true
                    }
                  })}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                
                <button
                  onClick={() => onSearchParamsChange({
                    ...searchParams,
                    enabledAlgorithms: {
                      exhaustiveGrid: false,
                      randomSampling: false,
                      geometricPatterns: false,
                      trigonometricRolling: false,
                      simulatedAnnealing: false
                    }
                  })}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  None
                </button>
                
                <button
                  onClick={() => onSearchParamsChange({
                    ...searchParams,
                    enabledAlgorithms: {
                      exhaustiveGrid: false,
                      randomSampling: false,
                      geometricPatterns: true,
                      trigonometricRolling: true,
                      simulatedAnnealing: false
                    }
                  })}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Best Only
                </button>
              </div>
            </div>

            {/* Search Strategy Controls */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px'
              }}>
                <input
                  type="checkbox"
                  checked={searchParams.contactConstraints}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    contactConstraints: e.target.checked
                  })}
                  style={{ transform: 'scale(1.2)' }}
                />
                Consider Contact Constraints
              </label>
              <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px', marginLeft: '28px' }}>
                Include touching configurations in search space
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px'
              }}>
                <input
                  type="checkbox"
                  checked={searchParams.localOptimization}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    localOptimization: e.target.checked
                  })}
                  style={{ transform: 'scale(1.2)' }}
                />
                 Local Optimization
              </label>
              <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px', marginLeft: '28px' }}>
                Apply hill-climbing to fine-tune promising solutions
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Grid Resolution:</label>
                <input
                  type="number"
                  min="6"
                  max="15"
                  value={searchParams.gridResolution}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    gridResolution: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Search Radius:</label>
                <input
                  type="number"
                  min="100"
                  max="500"
                  step="50"
                  value={searchParams.searchRadius}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    searchRadius: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>SA Iterations:</label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="500"
                  value={searchParams.maxIterations}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    maxIterations: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Random Samples:</label>
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={searchParams.randomSamples}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    randomSamples: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Temperature:</label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  step="25"
                  value={searchParams.temperature}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    temperature: parseFloat(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Perturbation:</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={searchParams.perturbationRadius}
                  onChange={e => onSearchParamsChange({
                    ...searchParams,
                    perturbationRadius: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Configuration */}
      {bestConfiguration && (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#155724', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Optimal Configuration Found
          </div>
          <div style={{ fontSize: '12px', marginBottom: '6px', color: '#155724' }}>
            <strong>Perimeter:</strong> {bestConfiguration.perimeter.toFixed(8)}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px', color: '#155724' }}>
            <strong>Method:</strong> {bestConfiguration.method}
            {improvement > 0 && (
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                (↓{improvement.toFixed(2)}%)
              </span>
            )}
          </div>
          <button
            onClick={onApplyBest}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
             Apply
          </button>
        </div>
      )}

      {/* Analysis Section */}
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <button
              onClick={() => setShowResults(!showResults)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {showResults ? '▼' : '▶'} Results Analysis ({searchResults.length})
            </button>
            
            {/* <button
              onClick={exportResults}
              style={{
                padding: '4px 8px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
              disabled
            >
              Export Data
            </button> */}
          </div>
          
          {showResults && (
            <div style={{
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '11px',
              background: 'white'
            }}>
              {/* Method Summary */}
              <div style={{ 
                padding: '10px',
                background: '#f8f9fa',
                borderBottom: '1px solid #dee2e6'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>Method Performance</div>
                {Object.entries(resultsByMethod).map(([method, results]) => {
                  const best = Math.min(...results.map(r => r.perimeter))
                  const avg = results.reduce((sum, r) => sum + r.perimeter, 0) / results.length
                  return (
                    <div key={method} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: '10px'
                    }}>
                      <span style={{ color: '#495057' }}>{method}:</span>
                      <span>
                        {results.length} configs, best: {best.toFixed(6)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Top Results */}
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchResults.slice(0, 20).map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 10px',
                      borderBottom: index < 19 ? '1px solid #f1f3f4' : 'none',
                      cursor: 'pointer',
                      backgroundColor: index === 0 ? '#e8f5e8' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => onResultSelect(result)}
                    onMouseEnter={e => e.target.style.backgroundColor = index === 0 ? '#d4edda' : '#f8f9fa'}
                    onMouseLeave={e => e.target.style.backgroundColor = index === 0 ? '#e8f5e8' : 'white'}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: index === 0 ? '600' : '500',
                          color: index === 0 ? '#155724' : '#212529'
                        }}>
                          #{index + 1} - {result.perimeter.toFixed(8)}
                        </div>
                        <div style={{ 
                          color: '#6c757d',
                          fontSize: '10px',
                          marginTop: '2px'
                        }}>
                          {result.method}
                          {result.iteration && ` (iter: ${result.iteration})`}
                        </div>
                      </div>
                      {index === 0 && (
                        <span style={{ 
                          fontSize: '12px',
                          color: '#28a745'
                        }}></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Research Statistics */}
      {searchResults.length > 0 && (
        <div style={{
          fontSize: '11px',
          color: '#6c757d',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#495057' }}>
            Search Statistics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            <div><strong>Configurations:</strong> {searchResults.length}</div>
            <div><strong>Methods Used:</strong> {Object.keys(resultsByMethod).length}</div>
            {bestConfiguration && (
              <>
                <div><strong>Best Perimeter:</strong> {bestConfiguration.perimeter.toFixed(8)}</div>
                <div><strong>Best Method:</strong> {bestConfiguration.method}</div>
              </>
            )}
            {searchResults.length > 1 && (
              <>
                <div><strong>Worst Found:</strong> {Math.max(...searchResults.map(r => r.perimeter)).toFixed(6)}</div>
                <div><strong>Range:</strong> {(Math.max(...searchResults.map(r => r.perimeter)) - Math.min(...searchResults.map(r => r.perimeter))).toFixed(6)}</div>
              </>
            )}
          </div>
          
          {improvement > 0 && (
            <div style={{ 
              marginTop: '8px',
              padding: '6px',
              backgroundColor: '#d4edda',
              borderRadius: '3px',
              color: '#155724',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Improvement: {improvement.toFixed(3)}% reduction in perimeter
            </div>
          )}
        </div>
      )}
     
    </div>
  )
}