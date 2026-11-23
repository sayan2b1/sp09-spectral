import React from 'react';

export default function TopBar({ applyPreset, isMicActive, toggleMicrophone, exportMetricsCSV }) {
    return (
        <header className="topbar">
            <div className="brand">
                <span className="app-badge">SP09 LAB</span>
                <span>Windowing & Spectral Leakage Workbench</span>
            </div>
            <div className="toolbar-actions">
                <button className="btn" onClick={() => applyPreset('coherent')}>
                    Preset 1: Coherent (10.0 Bins)
                </button>
                <button className="btn" onClick={() => applyPreset('leakage')}>
                    Preset 2: Leakage (10.5 Bins)
                </button>
                <button className="btn" onClick={() => applyPreset('twotone')}>
                    Preset 3: 2-Tone Masking
                </button>
                <button
                    className={`btn ${isMicActive ? 'btn-danger' : ''}`}
                    onClick={toggleMicrophone}
                >
                    {isMicActive ? '● Stop Live Mic' : '🎤 Live Mic Input'}
                </button>
                <button className="btn btn-primary" onClick={exportMetricsCSV}>
                    ⬇ Export CSV
                </button>
            </div>
        </header>
    );
}
