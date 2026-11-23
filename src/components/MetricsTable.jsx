import React from 'react';
import { WINDOW_COLORS } from '../dspEngine';

export default function MetricsTable({ metricsList, N, binSpacing, activeTab }) {
    return (
        <div className="chart-card" style={{ flex: activeTab === 'metrics' ? 1 : 'unset' }}>
            <div className="chart-header">
                <span>Real-Time Quantified Lobe Metrics (N = {N}, Δf = {binSpacing} Hz)</span>
            </div>
            <table className="metrics-table">
                <thead>
                    <tr>
                        <th>Window Function</th>
                        <th>-3 dB Main-Lobe Width</th>
                        <th>Null-to-Null Width</th>
                        <th>Peak Side-Lobe Level (PSL)</th>
                        <th>Detected Signal Peak</th>
                    </tr>
                </thead>
                <tbody>
                    {metricsList.map((m) => (
                        <tr key={m.windowType}>
                            <td>
                                <span className="color-dot" style={{ backgroundColor: WINDOW_COLORS[m.windowType], display: 'inline-block', marginRight: 8 }} />
                                <strong>{m.windowType}</strong>
                            </td>
                            <td>{m.width3dB_Hz} Hz ({m.width3dB_Bins} bins)</td>
                            <td>{m.nullWidth_Hz} Hz ({m.nullWidth_Bins} bins)</td>
                            <td>
                                <span
                                    className="badge"
                                    style={{
                                        backgroundColor: Number(m.peakSideLobe_dB) < -40 ? '#065f46' : Number(m.peakSideLobe_dB) < -25 ? '#1e40af' : '#7f1d1d',
                                        color: '#fff'
                                    }}
                                >
                                    {m.peakSideLobe_dB} dB
                                </span>
                            </td>
                            <td>{m.detectedFreqHz} Hz</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
