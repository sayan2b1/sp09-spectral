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
            <div className="readout" title="Observation sample count N vs zero-padded FFT size M (evaluates DTFT interpolation density).">
                <span className="readout-key">SAMPLES / FFT</span>
                <span className="readout-val">{N} / {nFFT}</span>
            </div>
            <div className="readout" title="Total number of complete sinusoid cycles captured within the observation duration T.">
                <span className="readout-key">CYCLES (k = f₀ · T)</span>
                <span className="readout-val">{cycles.toFixed(3)}</span>
            </div>
            <div className="readout" title="Integer cycles (k ∈ ℤ) indicate Coherent Lock with zero leakage; fractional cycles cause spectral leakage.">
                <span className="readout-key">BIN ALIGNMENT</span>
                <span className={`readout-status ${isCoherent ? 'is-coherent' : 'is-leakage'}`}>
                    {isCoherent ? '● COHERENT LOCK' : '▲ NON-COHERENT'}
                </span>
            </div>
            <div className="readout" title="Theoretical Peak Side-Lobe Level (dynamic range limit) of the primary channel window.">
                <span className="readout-key">CH1 PSLL</span>
                <span className="readout-val">{ch1Psll}</span>
            </div>
            <div className="readout" title="Integrated percentage of total signal energy that spills outside the theoretical main-lobe bandwidth.">
                <span className="readout-key">LEAKED POWER</span>
                <span className="readout-val">{leakedPowerRatio.toFixed(2)}%</span>
            </div>
        </section>
    );
}
