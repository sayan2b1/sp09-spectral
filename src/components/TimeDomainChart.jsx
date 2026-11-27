// src/components/TimeDomainChart.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { WINDOW_COLORS } from '../dspEngine';

export default function TimeDomainChart({ timeData, primaryWindow, theme }) {
    const isLight = theme === 'light';
    const gridColor = isLight ? '#e2e8f0' : '#1f2937';
    const axisColor = isLight ? '#64748b' : '#9ca3af';
    const rawColor = isLight ? '#94a3b8' : '#64748b';
    const envColor = isLight ? '#0f172a' : '#f8fafc';
    const windowedColor = WINDOW_COLORS[primaryWindow] || (isLight ? '#dc2626' : '#ef4444');

    const tooltipContentStyle = isLight
        ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
        : { backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb', borderRadius: '6px' };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <span className="bay-id">TRACE A // </span>
                    <strong style={{ fontSize: '0.88rem' }}>Time Domain — Capture &amp; Window Envelope</strong>
                </div>
                <span className="chart-meta">Input Signal x[n] · Window w[n] ({primaryWindow})</span>
            </div>

            <div style={{ flex: 1, minHeight: 200, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <LineChart data={timeData} margin={{ top: 8, right: 16, bottom: 12, left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="time"
                            stroke={axisColor}
                            fontSize={11}
                            unit="s"
                        />
                        <YAxis
                            domain={[-1.2, 1.2]}
                            ticks={[-1.0, -0.5, 0, 0.5, 1.0]}
                            stroke={axisColor}
                            fontSize={11}
                            label={{ value: 'Amplitude', angle: -90, position: 'insideLeft', offset: 12, style: { fill: axisColor, fontSize: 11 } }}
                        />
                        <Tooltip contentStyle={tooltipContentStyle} formatter={(val) => [val, '']} />
                        <Legend verticalAlign="top" height={28} />

                        <Line
                            type="monotone"
                            dataKey="raw"
                            name="Raw Input"
                            stroke={rawColor}
                            strokeWidth={1.2}
                            strokeDasharray="2 2"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="envelope"
                            name={`${primaryWindow} Envelope`}
                            stroke={envColor}
                            strokeWidth={1.4}
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="windowed"
                            name={`CH1 Windowed`}
                            stroke={windowedColor}
                            strokeWidth={2.0}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
