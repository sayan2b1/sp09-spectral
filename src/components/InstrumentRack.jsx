// src/components/InstrumentRack.jsx
import React from 'react';
import { WINDOW_TYPES, WINDOW_COLORS } from '../dspEngine';

export default function InstrumentRack({
    isSidebarOpen,
    toggleSidebar,
    signalType,
    setSignalType,
    f0,
    setF0,
    fs,
    setFs,
    duration,
    setDuration,
    N,
    primaryWindow,
    setPrimaryWindow,
    compareWindow,
    setCompareWindow,
    zeroPadFactor,
    setZeroPadFactor,
    magScale,
    setMagScale,
    selectedWindows,
    toggleWindow,
    overlayMode,
    setOverlayMode,
    customFileName,
    handleFileUpload
}) {
    return (
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header-mobile">
                <span>⚙️ Instrument Control Rail</span>
                <button className="btn" onClick={toggleSidebar} aria-label="Close Sidebar">✕ Close</button>
            </div>

            {/* SECTION 1: INPUT SOURCE */}
            <div className="panel-box">
                <div className="panel-title">1. Input Signal Source</div>

                <div className="control-group">
                    <label>Waveform Type</label>
                    <select value={signalType} onChange={(e) => setSignalType(e.target.value)}>
                        <option value="sine">Single Tone — sin(2πf₀t)</option>
                        <option value="two_tone">Two-Tone Masking (0 dB + -32 dB @ +18 Hz)</option>
                        <option value="square">Square Wave (Odd Harmonics)</option>
                        <option value="multi_tone">3-Tone Composite (f₀, 1.5f₀, 2.2f₀)</option>
                        <option value="chirp">Linear FM Chirp</option>
                        <option value="custom">Custom Audio / CSV Stream</option>
                    </select>
                </div>

                {signalType !== 'custom' && (
                    <div className="control-group">
                        <div className="field-head">
                            <label>Tone Frequency (f₀)</label>
                            <span className="unit-tag">Hz</span>
                        </div>
                        <div className="input-pair">
                            <input
                                type="range"
                                min="10"
                                max={Math.floor(fs / 2 - 10)}
                                step="0.5"
                                value={f0}
                                onChange={(e) => setF0(Number(e.target.value))}
                            />
                            <input
                                type="number"
                                min="1"
                                max={Math.floor(fs / 2)}
                                step="0.5"
                                value={f0}
                                onChange={(e) => setF0(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                <div className="control-group">
                    <label>Sampling Rate (fₛ)</label>
                    <select value={fs} onChange={(e) => setFs(Number(e.target.value))}>
                        <option value={500}>500 Hz</option>
                        <option value={1000}>1000 Hz (Standard Lab)</option>
                        <option value={2000}>2000 Hz</option>
                        <option value={4000}>4000 Hz</option>
                        <option value={8000}>8000 Hz (Telephony)</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>
                        <span>Custom Audio / CSV</span>
                        {customFileName && <strong style={{ color: 'var(--accent)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{customFileName}</strong>}
                    </label>
                    <input type="file" accept=".wav,.mp3,.csv,.txt" onChange={handleFileUpload} />
                </div>
            </div>

            {/* SECTION 2: WINDOW & CAPTURE */}
            <div className="panel-box">
                <div className="panel-title">2. Window &amp; Capture Duration</div>

                <div className="control-group">
                    <div className="field-head">
                        <label>Capture Duration (T)</label>
                        <span className="unit-tag">sec</span>
                    </div>
                    <div className="input-pair">
                        <input
                            type="range"
                            min="0.02"
                            max="1.0"
                            step="0.005"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        />
                        <input
                            type="number"
                            min="0.02"
                            max="2.0"
                            step="0.01"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Computed Sample Count N = <strong>{N} samples</strong> (Bluestein Exact-N)
                    </div>
                </div>

                <div className="control-group">
                    <label>Comparison Mode</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button
                            type="button"
                            className={`btn ${overlayMode === 'ch1_ch2' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem' }}
                            onClick={() => setOverlayMode('ch1_ch2')}
                        >
                            CH1 vs CH2 Overlay
                        </button>
                        <button
                            type="button"
                            className={`btn ${overlayMode === 'all_windows' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem' }}
                            onClick={() => setOverlayMode('all_windows')}
                        >
                            All Windows (6x)
                        </button>
                    </div>
                </div>

                {overlayMode === 'ch1_ch2' ? (
                    <>
                        <div className="control-group">
                            <label>CH1 Primary Window</label>
                            <select value={primaryWindow} onChange={(e) => setPrimaryWindow(e.target.value)}>
                                {WINDOW_TYPES.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                        <div className="control-group">
                            <label>CH2 Reference Overlay</label>
                            <select value={compareWindow} onChange={(e) => setCompareWindow(e.target.value)}>
                                <option value="none">Off (Single Trace)</option>
                                {WINDOW_TYPES.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </>
                ) : (
                    <div className="control-group">
                        <label>Active Windows to Plot</label>
                        <div className="checkbox-list" style={{ marginTop: 6 }}>
                            {WINDOW_TYPES.map((wType) => (
                                <label key={wType} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedWindows.includes(wType)}
                                        onChange={() => toggleWindow(wType)}
                                    />
                                    <span className="color-dot" style={{ backgroundColor: WINDOW_COLORS[wType] }} />
                                    <span>{wType}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 3: FFT DISPLAY & INTERPOLATION */}
            <div className="panel-box">
                <div className="panel-title">3. FFT Display &amp; DTFT Scaling</div>

                <div className="control-group">
                    <label>Zero-Padding (DTFT Interp.)</label>
                    <select value={zeroPadFactor} onChange={(e) => setZeroPadFactor(Number(e.target.value))}>
                        <option value={1}>1x — Exact N-pt DFT (No Interp.)</option>
                        <option value={2}>2x Zero-Padding</option>
                        <option value={4}>4x Zero-Padding</option>
                        <option value={8}>8x Zero-Padding (Dense DTFT)</option>
                        <option value={16}>16x Zero-Padding (Super Dense)</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Magnitude Scale</label>
                    <select value={magScale} onChange={(e) => setMagScale(e.target.value)}>
                        <option value="db">Logarithmic (dB) — Full Dynamic Range</option>
                        <option value="linear">Linear (Normalized Amplitude: 0 to 1)</option>
                    </select>
                </div>
            </div>
        </aside>
    );
}
