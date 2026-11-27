// src/components/SpectrumChart.jsx
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { WINDOW_COLORS } from '../dspEngine';

export default function SpectrumChart({
    spectrumData,
    overlayMode,
    primaryWindow,
    compareWindow,
    selectedWindows,
    fs,
    magScale,
    theme
}) {
    const isLight = theme === 'light';
    const gridColor = isLight ? '#e2e8f0' : '#1f2937';
    const axisColor = isLight ? '#64748b' : '#9ca3af';
    const isDb = magScale === 'db';

    const yDomain = isDb ? [-110, 6] : [0, 1.1];
    const yTicks = isDb ? [0, -20, -40, -60, -80, -100] : [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const yLabel = isDb ? 'Magnitude (dB)' : 'Magnitude (Linear)';

    const tooltipContentStyle = isLight
        ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
        : { backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb', borderRadius: '6px' };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <span className="bay-id">TRACE B // </span>
                    <strong style={{ fontSize: '0.88rem' }}>Frequency Domain — Single-Sided Magnitude Spectrum</strong>
                </div>
                <span className="chart-meta">
                    Bluestein Exact-N FFT | Coherent Gain Normalized | {isDb ? 'Logarithmic (dB)' : 'Linear'}
                </span>
            </div>

            <div style={{ flex: 1, minHeight: 240, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <LineChart data={spectrumData} margin={{ top: 8, right: 16, bottom: 12, left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                            dataKey="freq"
                            stroke={axisColor}
                            type="number"
                            domain={[0, fs / 2]}
                            tickCount={11}
                            fontSize={11}
                            unit=" Hz"
                        />
                        <YAxis
                            domain={yDomain}
                            ticks={yTicks}
                            stroke={axisColor}
                            fontSize={11}
                            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 12, style: { fill: axisColor, fontSize: 11 } }}
                        />
                        <Tooltip contentStyle={tooltipContentStyle} formatter={(val) => [isDb ? `${val} dB` : val, 'Magnitude']} />
                        <Legend verticalAlign="top" height={28} />

                        {overlayMode === 'ch1_ch2' ? (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="CH1"
                                    name={`CH1 ${primaryWindow}`}
                                    stroke={WINDOW_COLORS[primaryWindow] || '#C83E2B'}
                                    strokeWidth={2.2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                {compareWindow !== 'none' && compareWindow !== primaryWindow && (
                                    <Line
                                        type="monotone"
                                        dataKey="CH2"
                                        name={`CH2 ${compareWindow}`}
                                        stroke={compareWindow === 'Rectangular' ? '#165B8C' : (WINDOW_COLORS[compareWindow] || '#165B8C')}
                                        strokeWidth={1.8}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                )}
                            </>
                        ) : (
                            selectedWindows.map((wType) => (
                                <Line
                                    key={wType}
                                    type="monotone"
                                    dataKey={wType}
                                    name={wType}
                                    stroke={WINDOW_COLORS[wType]}
                                    strokeWidth={wType === primaryWindow ? 2.2 : 1.6}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            ))
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
