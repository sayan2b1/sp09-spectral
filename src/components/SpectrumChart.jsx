import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { WINDOW_COLORS } from '../dspEngine';

export default function SpectrumChart({ spectrumData, selectedWindows, fs }) {
    return (
        <div className="chart-card">
            <div className="chart-header">
                <span>Zero-Padded Magnitude Spectrum |X(f)| (Normalized dB)</span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>FFT Size: 2048 pts | fs: {fs} Hz</span>
            </div>
            <div style={{ flex: 1, minHeight: 220, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                    <LineChart data={spectrumData} margin={{ top: 5, right: 20, bottom: 10, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="freq" stroke="#9ca3af" type="number" domain={[0, fs / 2]} tickCount={11} />
                        <YAxis domain={[-100, 0]} ticks={[0, -20, -40, -60, -80, -100]} stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
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
