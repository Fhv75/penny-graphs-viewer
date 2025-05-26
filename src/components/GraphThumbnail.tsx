// src/components/GraphThumbnail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

export default function GraphThumbnail({ graph, size = 70 }) {
  const divRef = useRef(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    /* 1. crear mini-red de vis-network */
    const net = new Network(
      divRef.current,
      {
        nodes: graph.nodes.map(id => ({ id })),
        edges: graph.edges.map(([f, t]) => ({ from: f, to: t }))
      },
      {
        physics: false,
        height : `${size}px`,
        width  : `${size}px`,
        nodes  : { shape:'dot', size:8, color:'#8fbfff', borderWidth:0 },
        edges  : { color:'#8fbfff', width:1 },
        layout : { improvedLayout:true }
      }
    );

    /* 2. capturar imagen sólo cuando vis ya dibujó */
    const capture = () => {
      const canvas = divRef.current ? (divRef.current as HTMLDivElement).querySelector('canvas') : null;
      if (canvas) setUrl(canvas.toDataURL('image/png'));
      net.destroy();
    };

    net.once('afterDrawing', capture);      // evento fiable
    const fallback = setTimeout(capture, 300); // por si acaso

    /* cleanup */
    return () => {
      clearTimeout(fallback);
      net.destroy();
    };
  }, [graph, size]);

  return (
    <>
      {/* canvas oculto para vis-network */}
      <div
        ref={divRef}
        style={{ position:'absolute', inset:0, visibility:'hidden' }}
      />

      {/* miniatura o placeholder */}
      {url ? (
        <img
          src={url}
          alt="mini"
          width={size}
          height={size}
          style={{ display:'block', borderRadius:4 }}
        />
      ) : (
        <div
          style={{
            width:size,
            height:size,
            background:'#f0f0f0',
            borderRadius:4
          }}
        />
      )}
    </>
  );
}
