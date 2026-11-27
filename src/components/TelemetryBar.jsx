// src/components/TelemetryBar.jsx
import React from 'react';

export default function TelemetryBar({
    N,
    nFFT,
    cycles,
    isCoherent,
    ch1Psll,
    leakedPowerRatio
}) {
    return (
        <section className="telemetry-bar" aria-label="Real-time spectral telemetry readouts">
            <div className="readout">
                <span className="readout-key">SAMPLES / FFT</span>
                <span className="readout-val">{N} / {nFFT}</span>
            </div>
            <div className="readout">
                <span className="readout-key">CYCLES (k = f₀ · T)</span>
                <span className="readout-val">{cycles.toFixed(3)}</span>
            </div>
            <div className="readout">
                <span className="readout-key">BIN ALIGNMENT</span>
                <span className={`readout-status ${isCoherent ? 'is-coherent' : 'is-leakage'}`}>
                    {isCoherent ? '● COHERENT LOCK' : '▲ NON-COHERENT'}
                </span>
            </div>
            <div className="readout">
                <span className="readout-key">CH1 PSLL</span>
                <span className="readout-val">{ch1Psll}</span>
            </div>
            <div className="readout">
                <span className="readout-key">LEAKED POWER</span>
                <span className="readout-val">{leakedPowerRatio.toFixed(2)}%</span>
            </div>
        </section>
    );
}
