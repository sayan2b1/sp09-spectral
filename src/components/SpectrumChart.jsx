// src/components/SpectrumChart.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { WINDOW_COLORS } from '../dspEngine';

export default function SpectrumChart({ spectrumData, selectedWindows, fs, theme }) {
    const isLight = theme === 'light';
    const gridColor = isLight ? '#e2e8f0' : '#1f2937';
    const axisColor = isLight ? '#64748b' : '#9ca3af';
    const tooltipContentStyle = isLight
        ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
        : { backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb', borderRadius: '6px' };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <span>Zero-Padded Magnitude Spectrum |X(f)| (Normalized dB)</span>
                <span className="chart-meta">FFT Size: 2048 pts | fs: {fs} Hz</span>
            </div>
            <div style={{ flex: 1, minHeight: 220, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                    <LineChart data={spectrumData} margin={{ top: 5, right: 15, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="freq"
                            stroke={axisColor}
                            type="number"
                            domain={[0, fs / 2]}
                            tickCount={11}
                            fontSize={11}
                        />
                        <YAxis
                            domain={[-100, 0]}
                            ticks={[0, -20, -40, -60, -80, -100]}
                            stroke={axisColor}
                            fontSize={11}
                        />
                        <Tooltip contentStyle={tooltipContentStyle} />
                        <Legend verticalAlign="top" height={28} />
                        {selectedWindows.map((wType) => (
                            <Line
                                key={wType}
                                type="monotone"
                                dataKey={wType}
                                stroke={WINDOW_COLORS[wType]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
