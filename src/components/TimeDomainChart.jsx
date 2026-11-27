// src/components/TimeDomainChart.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function TimeDomainChart({ timeData, activeTimeWindow, theme }) {
    const isLight = theme === 'light';
    const gridColor = isLight ? '#e2e8f0' : '#1f2937';
    const axisColor = isLight ? '#64748b' : '#9ca3af';
    const rawColor = isLight ? '#64748b' : '#9ca3af';
    const windowedColor = isLight ? '#0284c7' : '#38bdf8';
    const tooltipContentStyle = isLight
        ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
        : { backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb', borderRadius: '6px' };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <span>Time-Domain Tapered Signal: x[n] · w[n] ({activeTimeWindow})</span>
            </div>
            <div style={{ flex: 1, minHeight: 180, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <LineChart data={timeData} margin={{ top: 5, right: 15, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="sample" stroke={axisColor} fontSize={11} />
                        <YAxis domain={[-1.5, 1.5]} stroke={axisColor} fontSize={11} />
                        <Tooltip contentStyle={tooltipContentStyle} />
                        <Legend verticalAlign="top" height={28} />
                        <Line
                            type="monotone"
                            dataKey="raw"
                            name="Input x[n]"
                            stroke={rawColor}
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="window"
                            name="Window w[n]"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="windowed"
                            name="Windowed Output"
                            stroke={windowedColor}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
