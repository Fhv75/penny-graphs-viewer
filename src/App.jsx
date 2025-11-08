import React, { useEffect, useState } from 'react'
import GraphViewer   from './components/GraphViewer'
import GraphList     from './components/GraphList'
import loadAllGraphs from './utils/loadGraph6Files' 
import './App.css'


export default function App () {
  const [collections, setCollections] = useState([])
  const [setIdx, setSetIdx]           = useState(0)
  const [graphIdx, setGraphIdx]       = useState(0)
  const [showHull, setShowHull]       = useState(true)

  useEffect(() => {
    loadAllGraphs().then(txtSets => {
      setCollections([...txtSets])
    }).catch(error => {
      console.error("Error cargando grafos:", error)
    })
  }, [])

  const currentGraphs = collections[setIdx]?.graphs ?? []
  const currentGraph  = currentGraphs[graphIdx]

  return (
    <div className="app">
      <div className="main">
        <div className="header">
          <h1>Contact Graph Visualizer</h1>
        </div>

        <div className="viewer-wrapper">
          {currentGraph && (
            <GraphViewer
              graph={currentGraph}
              showHull={showHull}
            />
          )}
        </div>
      </div>

      <aside className="sidebar">
        <h2>Colecciones</h2>
        {collections.map((c, i) => (
          <button
            key={c.label}
            className={i === setIdx ? 'selected' : ''}
            onClick={() => { setSetIdx(i); setGraphIdx(0); }}
          >
            {c.label}
          </button>
        ))}

        <div className="controls" style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={showHull}
              onChange={() => setShowHull(s => !s)}
            />
            Mostrar envolvente
          </label>
        </div>

        <h2>Grafos</h2>
        <GraphList
          graphs={currentGraphs}
          currentIndex={graphIdx}
          onSelect={setGraphIdx}
        />
      </aside>
    </div>
  )
}