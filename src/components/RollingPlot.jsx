import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RollingPlot = ({ plotData, isVisible, onClose }) => {
    const [plotMode, setPlotMode] = useState('perimeter-vs-angle');
    const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        if (!plotData || plotData.length === 0) {
            setDisplayData([]);
            return;
        }

        let newDisplayData = [];

        switch (plotMode) {
            case 'perimeter-vs-angle':
                newDisplayData = plotData.map((data, index) => {
                    const stepDegrees = (data.stepAngle || 0.017453292519943295) * 180 / Math.PI;
                    const cumulativeAngle = stepDegrees * (index + 1);
                    
                    return {
                        angle: cumulativeAngle,
                        perimeter: data.perimeter || 0,
                        step: index
                    };
                });
                break;

            case 'perimeter-vs-time':
                newDisplayData = plotData.map((data, index) => ({
                    step: index,
                    perimeter: data.perimeter || 0,
                    angle: (index + 1) * ((data.stepAngle || 0.017453292519943295) * 180 / Math.PI)
                }));
                break;

            case 'individual-angles':
                newDisplayData = plotData.map((data, index) => {
                    const item = {
                        step: index,
                        perimeter: data.perimeter || 0
                    };
                    
                    if (data.diskAngles) {
                        Object.entries(data.diskAngles).forEach(([diskId, angle]) => {
                            const stepAngleRad = angle;
                            const cumulativeAngleDeg = (stepAngleRad * (index + 1) * 180) / Math.PI;
                            item[`disk_${diskId}`] = cumulativeAngleDeg;
                        });
                    }
                    
                    return item;
                });
                break;break;
        }

        setDisplayData(newDisplayData);
    }, [plotData, plotMode]);

    const logData = () => {
        console.log('=== PLOT DEBUG INFO ===');
        console.log('Current plot mode:', plotMode);
        console.log('Raw plotData:', plotData);
        console.log('Display data:', displayData);
    };

    if (!isVisible) return null;

    const perimeterValues = displayData.map(d => d.perimeter).filter(v => !isNaN(v));
    const perimeterMin = perimeterValues.length > 0 ? Math.min(...perimeterValues) : 0;
    const perimeterMax = perimeterValues.length > 0 ? Math.max(...perimeterValues) : 1;
    const perimeterPadding = (perimeterMax - perimeterMin) * 0.1 || 0.1;

    const renderChart = () => {
        switch (plotMode) {
            case 'perimeter-vs-angle':
                return (
                    <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="angle" 
                            domain={[0, 'dataMax']}
                            label={{ value: 'Rotation Angle (°)', position: 'insideBottom', offset: -10 }}
                            tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
                        />
                        <YAxis 
                            domain={[perimeterMin - perimeterPadding, perimeterMax + perimeterPadding]}
                            tickFormatter={(value) => value.toFixed(6)}
                            label={{ value: 'Hull Perimeter', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                            formatter={(value) => typeof value === 'number' ? value.toFixed(8) : value}
                            labelFormatter={(angle) => `Angle: ${typeof angle === 'number' ? angle.toFixed(3) : angle}°`}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="perimeter" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Hull Perimeter"
                        />
                    </LineChart>
                );

            case 'perimeter-vs-time':
                return (
                    <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="step" 
                            label={{ value: 'Step Number', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                            yAxisId="left"
                            domain={[perimeterMin - perimeterPadding, perimeterMax + perimeterPadding]}
                            tickFormatter={(value) => value.toFixed(6)}
                            label={{ value: 'Hull Perimeter', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Angle (°)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip formatter={(value) => value.toFixed(6)} />
                        <Legend />
                        <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="perimeter" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Perimeter"
                        />
                        <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="angle" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Angle (°)"
                        />
                    </LineChart>
                );

            case 'individual-angles':
                const diskKeys = displayData.length > 0 ? 
                    Object.keys(displayData[0]).filter(k => k.startsWith('disk_')) : [];
                const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
                
                return (
                    <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="step" 
                            label={{ value: 'Step Number', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                            yAxisId="left"
                            domain={[perimeterMin - perimeterPadding, perimeterMax + perimeterPadding]}
                            tickFormatter={(value) => value.toFixed(6)}
                            label={{ value: 'Hull Perimeter', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Disk Angle (°)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip formatter={(value) => value.toFixed(6)} />
                        <Legend />
                        <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="perimeter" 
                            stroke="#8884d8" 
                            strokeWidth={3}
                            dot={{ r: 2 }}
                            name="Perimeter"
                        />
                        {diskKeys.map((key, i) => (
                            <Line 
                                key={key}
                                yAxisId="right"
                                type="monotone" 
                                dataKey={key} 
                                stroke={colors[i % colors.length]} 
                                strokeWidth={2}
                                dot={{ r: 1 }}
                                name={`Disk ${key.replace('disk_', '')}`}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '50px',
            right: '20px',
            width: '700px',
            height: '500px',
            backgroundColor: 'white',
            border: '2px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
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
                    Multi-Disk Rolling Analysis
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select 
                        value={plotMode} 
                        onChange={(e) => setPlotMode(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="perimeter-vs-angle">Perimeter vs Angle</option>
                        <option value="perimeter-vs-time">Perimeter vs Time</option>
                        <option value="individual-angles">Individual Disk Angles</option>
                    </select>
                    <button
                        onClick={logData}
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
                        Log Data
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

            <div style={{ flex: 1, padding: '10px' }}>
                {displayData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
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

            {displayData.length > 0 && (
                <div style={{
                    padding: '8px 15px',
                    borderTop: '1px solid #ddd',
                    backgroundColor: '#f8f9fa',
                    fontSize: '12px',
                    color: '#666'
                }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <span>Data Points: {displayData.length}</span>
                        <span>
                            Perimeter Range: {perimeterMin.toFixed(6)} to {perimeterMax.toFixed(6)}
                        </span>
                        {plotMode === 'perimeter-vs-angle' && displayData.length > 0 && (() => {
                            const minPerimeterPoint = displayData.reduce((min, p) => 
                                p.perimeter < min.perimeter ? p : min
                            );
                            const maxPerimeterPoint = displayData.reduce((max, p) => 
                                p.perimeter > max.perimeter ? p : max
                            );
                            return (
                                <>
                                    <span>
                                        Min at: {minPerimeterPoint.angle.toFixed(3)}°
                                    </span>
                                    <span>
                                        Max at: {maxPerimeterPoint.angle.toFixed(3)}°
                                    </span>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RollingPlot;