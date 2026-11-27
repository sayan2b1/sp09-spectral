// src/components/TopBar.jsx
import React from 'react';

export default function TopBar({
    applyPreset,
    isMicActive,
    toggleMicrophone,
    exportMetricsCSV,
    theme,
    toggleTheme,
    isSidebarOpen,
    toggleSidebar
}) {
    return (
        <header className="topbar">
            <div className="brand">
                <button
                    className={`btn btn-sidebar-toggle ${isSidebarOpen ? 'active' : ''}`}
                    onClick={toggleSidebar}
                    title="Toggle Parameters Sidebar"
                    aria-label="Toggle Parameters Sidebar"
                >
                    ⚙️ Controls {isSidebarOpen ? '▾' : '▸'}
                </button>

                <button
                    className="btn btn-theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>

                <span className="app-badge">SPEC-01</span>
                <span className="brand-text">Spectral Leakage Analyzer</span>
            </div>

            <div className="toolbar-actions">
                <span className="strip-label">SETUPS:</span>
                <button
                    className="btn"
                    onClick={() => applyPreset('coherent')}
                    title="Coherent Lock: Exact integer cycles (k = 10.000) -> 0.00% Leakage"
                >
                    Coherent Lock
                </button>
                <button
                    className="btn"
                    onClick={() => applyPreset('leakage')}
                    title="Half-Bin Leakage: Non-integer cycles (k = 10.500) -> Maximum Leakage"
                >
                    Half-Bin Leakage
                </button>
                <button
                    className="btn"
                    onClick={() => applyPreset('twotone')}
                    title="Two-Tone Masking: Strong tone (0 dB) + Weak tone (-32 dB @ +18 Hz)"
                >
                    Two-Tone Masking
                </button>
                <button
                    className="btn"
                    onClick={() => applyPreset('zeropad')}
                    title="8x Zero-Pad: Continuous DTFT lobe interpolation and side lobes"
                >
                    8x Zero-Pad
                </button>

                <button
                    className={`btn ${isMicActive ? 'btn-danger' : ''}`}
                    onClick={toggleMicrophone}
                    title="Toggle Live Audio / Microphone Input"
                >
                    {isMicActive ? '● Stop Mic' : '🎤 Live Mic'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={exportMetricsCSV}
                    title="Export Quantified Metrics to CSV"
                >
                    ⬇ Export CSV
                </button>
            </div>
        </header>
    );
}
