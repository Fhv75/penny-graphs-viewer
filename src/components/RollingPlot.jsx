import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RollingPlot = ({ angleData, perimeterData, isVisible, onClose }) => {
    const [plotData, setPlotData] = useState([]);

    useEffect(() => {
        if (angleData.length > 0 && perimeterData.length > 0) {
        const minLength = Math.min(angleData.length, perimeterData.length);
        const newPlotData = [];
        
        for (let i = 0; i < minLength; i++) {
            newPlotData.push({
            index: i,
            angle: (angleData[i] * 180) / Math.PI, // Convert to degrees
            perimeter: perimeterData[i] || 0,
            angleDiff: i > 0 ? ((angleData[i] - angleData[0]) * 180) / Math.PI : 0
            });
        }
        
        setPlotData(newPlotData);
        }
    }, [angleData, perimeterData]);

    const clearData = () => {
        console.log(plotData);  
        setPlotData([]);
    };

    if (!isVisible) return null;

    return (
        <div style={{
        position: 'fixed',
        top: '50px',
        right: '20px',
        width: '600px',
        height: '400px',
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
        }}>
        {/* Header */}
        <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px 6px 0 0'
        }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            Rolling Analysis: Angle vs Perimeter
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
            <button
                onClick={clearData}
                style={{
                padding: '4px 8px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
                }}
            >
                Clear Data
            </button>
            <button
                onClick={onClose}
                style={{
                padding: '4px 8px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
                }}
            >
                ✕
            </button>
            </div>
        </div>

        {/* Plot Area */}
        <div style={{ flex: 1, padding: '10px' }}>
            {plotData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={plotData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="angleDiff" 
                    label={{ value: 'Angle Moved (degrees)', position: 'insideBottom', offset: -10 }}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                    label={{ value: 'Hull Perimeter', angle: -90, position: 'insideLeft' }}
                    domain={['dataMin', 'dataMax']}
                    allowDecimals={true}
                    tickFormatter={(value) => value.toFixed(4)}
                />
                <Tooltip 
                    formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(8) : value,
                    /* name === 'perimeter' ? 'Hull Perimeter' : 'Angle (deg)' */
                    name === 'angle' ? 'Angle (deg)' : 'Hull Perimeter'
                    ]}
                    labelFormatter={(value) => `Angle: ${typeof value === 'number' ? value.toFixed(4) : value}°`}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="perimeter" 
                    stroke="#2196f3" 
                    strokeWidth={2}
                    dot={{ fill: '#2196f3', strokeWidth: 1, r: 2 }}
                    name="Hull Perimeter"
                />
                </LineChart>
            </ResponsiveContainer>
            ) : (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#666',
                fontSize: '14px'
            }}>
                No data available. Start rolling to see the plot.
            </div>
            )}
        </div>

        {/* Stats */}
        {plotData.length > 0 && (
            <div style={{
            padding: '8px 15px',
            borderTop: '1px solid #ddd',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            color: '#666'
            }}>
            <div style={{ display: 'flex', gap: '20px' }}>
                <span>Data Points: {plotData.length}</span>
                <span>
                Angle Range: {plotData.length > 1 ? 
                    `${plotData[0].angleDiff.toFixed(1)}° to ${plotData[plotData.length - 1].angleDiff.toFixed(1)}°` : 
                    'N/A'
                }
                </span>
                <span>
                Perimeter Range: {plotData.length > 0 ? 
                    `${Math.min(...plotData.map(p => p.perimeter)).toFixed(8)} to ${Math.max(...plotData.map(p => p.perimeter)).toFixed(8)}` : 
                    'N/A'
                }
                </span>
                <span>
                Max Angle that delivers Max Perimeter: 
                {plotData.length > 0 ? 
                    `${plotData.reduce((max, p) => p.perimeter > max.perimeter ? p : max).angleDiff.toFixed(4)}°` : 
                    'N/A'
                }
                </span>
            </div>
            </div>
        )}
        </div>
    );
};

export default RollingPlot;