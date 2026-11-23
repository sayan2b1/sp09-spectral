import React from 'react';
import { WINDOW_TYPES, WINDOW_COLORS } from '../dspEngine';

export default function InstrumentRack({
    signalType,
    setSignalType,
    customFileName,
    handleFileUpload,
    N,
    setN,
    fs,
    f1,
    setF1,
    f2,
    setF2,
    amp2,
    setAmp2,
    exactBinCount,
    selectedWindows,
    toggleWindow,
    activeTimeWindow,
    setActiveTimeWindow
}) {
    return (
        <aside className="sidebar">
            <div className="panel-box">
                <div className="panel-title">Signal Generator</div>
                <div className="control-group">
                    <label>Input Source</label>
                    <select value={signalType} onChange={(e) => setSignalType(e.target.value)}>
                        <option value="sine">Single Sinusoid</option>
                        <option value="dualsine">Dual Sinusoid (2-Tone)</option>
                        <option value="square">Square Wave</option>
                        <option value="chirp">Linear FM Chirp</option>
                        <option value="custom">Custom File / Mic Stream</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>
                        <span>Load Audio/Data (.wav, .csv)</span>
                        {customFileName && <span style={{ color: '#3b82f6' }}>{customFileName}</span>}
                    </label>
                    <input type="file" accept=".wav,.mp3,.csv,.txt" onChange={handleFileUpload} />
                </div>

                <div className="control-group">
                    <label>
                        <span>Window Length (N)</span>
                        <strong>{N} samples</strong>
                    </label>
                    <select value={N} onChange={(e) => setN(Number(e.target.value))}>
                        <option value={32}>32 samples</option>
                        <option value={64}>64 samples</option>
                        <option value={128}>128 samples</option>
                        <option value={256}>256 samples</option>
                    </select>
                </div>

                {signalType !== 'custom' && (
                    <>
                        <div className="control-group">
                            <label>
                                <span>Frequency f1</span>
                                <strong>{f1} Hz ({exactBinCount} bins)</strong>
                            </label>
                            <input
                                type="range"
                                min="20"
                                max={fs / 2 - 20}
                                step="0.25"
                                value={f1}
                                onChange={(e) => setF1(Number(e.target.value))}
                            />
                        </div>

                        {(signalType === 'dualsine' || signalType === 'chirp') && (
                            <div className="control-group">
                                <label>
                                    <span>Frequency f2</span>
                                    <strong>{f2} Hz</strong>
                                </label>
                                <input
                                    type="range"
                                    min="20"
                                    max={fs / 2 - 20}
                                    step="0.5"
                                    value={f2}
                                    onChange={(e) => setF2(Number(e.target.value))}
                                />
                            </div>
                        )}

                        {signalType === 'dualsine' && (
                            <div className="control-group">
                                <label>
                                    <span>2nd Tone Gain</span>
                                    <strong>{(20 * Math.log10(amp2)).toFixed(1)} dB</strong>
                                </label>
                                <input
                                    type="range"
                                    min="0.01"
                                    max="1"
                                    step="0.01"
                                    value={amp2}
                                    onChange={(e) => setAmp2(Number(e.target.value))}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="panel-box">
                <div className="panel-title">Active Windows Overlay</div>
                <div className="checkbox-list">
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

                <div className="control-group" style={{ marginTop: 12 }}>
                    <label>Time-Domain Envelope</label>
                    <select value={activeTimeWindow} onChange={(e) => setActiveTimeWindow(e.target.value)}>
                        {WINDOW_TYPES.map((wType) => (
                            <option key={wType} value={wType}>{wType}</option>
                        ))}
                    </select>
                </div>
            </div>
        </aside>
    );
}
