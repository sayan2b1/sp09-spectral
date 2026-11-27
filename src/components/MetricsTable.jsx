// src/components/MetricsTable.jsx
import React from 'react';
import { WINDOW_COLORS } from '../dspEngine';

export default function MetricsTable({ metricsList, N, binSpacing, activeTab, theme }) {
    const isLight = theme === 'light';

    return (
        <div className="chart-card" style={{ flex: activeTab === 'metrics' ? 1 : 'unset' }}>
            <div className="chart-header">
                <span>Real-Time Quantified Lobe Metrics (N = {N}, Δf = {binSpacing} Hz)</span>
                <span className="chart-meta">8192-pt Zero-Padded Interpolation</span>
            </div>
            <div className="table-responsive">
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
                        {metricsList.map((m) => {
                            const psl = Number(m.peakSideLobe_dB);
                            let badgeBg = '#7f1d1d';
                            if (psl < -40) {
                                badgeBg = isLight ? '#047857' : '#065f46';
                            } else if (psl < -25) {
                                badgeBg = isLight ? '#1d4ed8' : '#1e40af';
                            } else {
                                badgeBg = isLight ? '#b91c1c' : '#7f1d1d';
                            }

                            return (
                                <tr key={m.windowType}>
                                    <td>
                                        <span
                                            className="color-dot"
                                            style={{
                                                backgroundColor: WINDOW_COLORS[m.windowType],
                                                display: 'inline-block',
                                                marginRight: 8,
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                        <strong>{m.windowType}</strong>
                                    </td>
                                    <td>{m.width3dB_Hz} Hz ({m.width3dB_Bins} bins)</td>
                                    <td>{m.nullWidth_Hz} Hz ({m.nullWidth_Bins} bins)</td>
                                    <td>
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: badgeBg,
                                                color: '#ffffff'
                                            }}
                                        >
                                            {m.peakSideLobe_dB} dB
                                        </span>
                                    </td>
                                    <td>{m.detectedFreqHz} Hz</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
