// src/components/MetricsTable.jsx
import React from 'react';
import { WINDOW_SPECS, WINDOW_COLORS } from '../dspEngine';

export default function MetricsTable({ metricsList, N, binSpacing, activeTab, theme }) {
    const isLight = theme === 'light';

    return (
        <div className="chart-card" style={{ flex: activeTab === 'metrics' ? 1 : 'unset', height: 'auto', minHeight: 'auto' }}>
            <div className="chart-header">
                <div>
                    <span className="bay-id">BENCHMARK // </span>
                    <strong style={{ fontSize: '0.88rem' }}>Real-Time Quantified Window Metrics &amp; Leakage Benchmark (N = {N}, Δf = {binSpacing} Hz)</strong>
                </div>
                <span className="chart-meta">Sub-Bin Parabolic Interpolation &amp; Power Integration</span>
            </div>
            <div className="table-responsive">
                <table className="metrics-table">
                    <thead>
                        <tr>
                            <th>Window Function</th>
                            <th>Theoretical PSLL</th>
                            <th>-3 dB Main-Lobe Width</th>
                            <th>Null-to-Null Width</th>
                            <th>Measured PSL (dB)</th>
                            <th>Leaked Power Ratio (%) <span style={{ fontSize: '0.74rem', opacity: 0.85, fontWeight: 'normal' }}>(Window Benchmark)</span></th>
                            <th>Detected Peak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metricsList.map((m) => {
                            const psl = Number(m.peakSideLobe_dB);
                            let badgeBg = '#7f1d1d';
                            if (psl < -50) {
                                badgeBg = isLight ? '#047857' : '#065f46';
                            } else if (psl < -30) {
                                badgeBg = isLight ? '#1d4ed8' : '#1e40af';
                            } else if (psl < -20) {
                                badgeBg = isLight ? '#b45309' : '#92400e';
                            } else {
                                badgeBg = isLight ? '#b91c1c' : '#7f1d1d';
                            }

                            const leakedPower = m.leakedPowerRatio !== undefined ? Number(m.leakedPowerRatio) : 0;
                            const leakBadgeBg = leakedPower < 0.1
                                ? (isLight ? '#047857' : '#065f46')
                                : leakedPower < 2.0
                                ? (isLight ? '#1d4ed8' : '#1e40af')
                                : (isLight ? '#b91c1c' : '#7f1d1d');

                            const theoreticalPsll = WINDOW_SPECS[m.windowType]?.psll || '--';

                            return (
                                <tr key={m.windowType}>
                                    <td>
                                        <span
                                            className="color-dot"
                                            style={{
                                                backgroundColor: WINDOW_COLORS[m.windowType] || '#888',
                                                display: 'inline-block',
                                                marginRight: 8,
                                                verticalAlign: 'middle'
                                            }}
                                        />
                                        <strong>{m.windowType}</strong>
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>{theoreticalPsll}</td>
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
                                    <td>
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: leakBadgeBg,
                                                color: '#ffffff'
                                            }}
                                        >
                                            {leakedPower.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>{m.detectedFreqHz} Hz</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
