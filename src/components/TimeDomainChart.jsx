import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function TimeDomainChart({ timeData, activeTimeWindow }) {
    return (
        <div className="chart-card">
            <div className="chart-header">
                <span>Time-Domain Tapered Signal: x[n] · w[n] ({activeTimeWindow})</span>
            </div>
            <div style={{ flex: 1, minHeight: 180, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <LineChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="sample" stroke="#9ca3af" />
                        <YAxis domain={[-1.5, 1.5]} stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                        <Legend verticalAlign="top" height={28} />
                        <Line type="monotone" dataKey="raw" name="Input x[n]" stroke="#6b7280" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="window" name="Window w[n]" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="windowed" name="Windowed Output" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
