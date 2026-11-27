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
                    ⚙️ Controls
                </button>
                <span className="app-badge">SP09</span>
                <span className="brand-text">DSP Workbench</span>
            </div>

            <div className="toolbar-actions">
                <button
                    className="btn btn-theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>

                <button
                    className="btn"
                    onClick={() => applyPreset('coherent')}
                    title="Load Coherent Sampling Preset (10.0 Bins)"
                >
                    P1: Coherent
                </button>
                <button
                    className="btn"
                    onClick={() => applyPreset('leakage')}
                    title="Load Maximum Leakage Preset (10.5 Bins)"
                >
                    P2: Leakage
                </button>
                <button
                    className="btn"
                    onClick={() => applyPreset('twotone')}
                    title="Load 2-Tone Masking Preset"
                >
                    P3: 2-Tone
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
