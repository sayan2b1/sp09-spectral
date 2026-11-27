// src/components/MetricsTable.jsx
import React from 'react';
import { WINDOW_SPECS, WINDOW_COLORS } from '../dspEngine';

export default function MetricsTable({ metricsList, N, binSpacing, theme }) {
    const isLight = theme === 'light';

    return (
        <div className="chart-card" style={{ height: 'auto', minHeight: 'auto' }}>
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
                            <th title="Discrete window function w[n] applied across the finite observation duration N.">Window Function</th>
                            <th title="Theoretical Peak Side-Lobe Level: maximum asymptotic height of the first sidelobe relative to the 0 dB carrier peak.">Theor. PSLL</th>
                            <th title="-3 dB Main-Lobe Width: half-power bandwidth quantifying the fundamental frequency resolving power of the window.">-3 dB Width</th>
                            <th title="Null-to-Null Width: total frequency distance between the first zero-crossings flanking the main lobe.">Null-to-Null Width</th>
                            <th style={{ textAlign: 'center' }} title="Measured Peak Side-Lobe Level: actual highest secondary peak detected relative to the normalized carrier in dB.">Measured PSL</th>
                            <th style={{ textAlign: 'center' }} title="Leaked Power Ratio: analytical percentage of total spectral energy spilled outside the window's main-lobe bandwidth.">
                                Leaked Power (%)
                                <span style={{ display: 'block', fontSize: '0.67rem', fontWeight: 400, opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                                    (Benchmark)
                                </span>
                            </th>
                            <th style={{ textAlign: 'right' }} title="Detected Peak: fundamental carrier frequency identified via sub-bin parabolic / crest interpolation.">Detected Peak</th>
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
                                    <td style={{ textAlign: 'center' }}>
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
                                    <td style={{ textAlign: 'center' }}>
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
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.detectedFreqHz} Hz</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
