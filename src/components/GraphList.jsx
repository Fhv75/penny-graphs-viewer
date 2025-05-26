// src/components/GraphList.jsx
import React, { useState, useEffect } from 'react';
import GraphThumbnail from './GraphThumbnail'; // ajusta la ruta si es distinta

export default function GraphList({
  graphs,
  currentIndex,
  onSelect,
  className,
  pageSize = 10
}) {
  const [page, setPage] = useState(0);

  // Cada vez que cambie el set de grafos, volvemos a la página 0
  useEffect(() => {
    setPage(0);
  }, [graphs]);

  const pages = Math.max(1, Math.ceil(graphs.length / pageSize));
  const start = page * pageSize;
  const end = Math.min(start + pageSize, graphs.length);

  const prevPage = () => setPage(p => Math.max(p - 1, 0));
  const nextPage = () => setPage(p => Math.min(p + 1, pages - 1));

  return (
    <div className={className}>
      {pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <button onClick={prevPage} disabled={page === 0}>◀</button>
          <span style={{ fontSize: '0.9em' }}>
            pág. {page + 1} de {pages}
          </span>
          <button onClick={nextPage} disabled={page === pages - 1}>▶</button>
        </div>
      )}

      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${pageSize>20?70:80}px, 1fr))`,
        gap: '8px'
      }}>
        {graphs.slice(start, end).map((g, idx) => {
          const globalIdx = start + idx;
          const isActive  = globalIdx === currentIndex;
          // incluimos `page` en la key para forzar remonte al cambiar de página
          const thumbKey = `${page}-${globalIdx}`;
          return (
            <li key={thumbKey} style={{ textAlign: 'center' }}>
              <button
                onClick={() => onSelect(globalIdx)}
                style={{
                  border: isActive ? '2px solid #007acc' : '1px solid #ccc',
                  padding: 0,
                  borderRadius: 4,
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                {/* también ponemos key aquí, aunque con la del <li> basta */}
                <GraphThumbnail key={thumbKey} graph={g} size={70} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
