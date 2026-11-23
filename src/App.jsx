// src/App.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    WINDOW_TYPES,
    WINDOW_COLORS,
    generateWindow,
    generateSignal,
    computeMagnitudeSpectrumDB,
    quantifyWindowMetrics
} from './dspEngine';

export default function App() {
    const [activeTab, setActiveTab] = useState('workbench'); // 'workbench' | 'spectrum' | 'metrics'
    const [signalType, setSignalType] = useState('sine');
    const [fs, setFs] = useState(1000);
    const [N, setN] = useState(64);
    const [f1, setF1] = useState(164.06);
    const [f2, setF2] = useState(250.0);
    const [amp2, setAmp2] = useState(0.1);
    const [selectedWindows, setSelectedWindows] = useState(['Rectangular', 'Hann', 'Hamming', 'Blackman']);
    const [activeTimeWindow, setActiveTimeWindow] = useState('Hamming');
    const [customSamples, setCustomSamples] = useState(null);
    const [customFileName, setCustomFileName] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);

    const micIntervalRef = useRef(null);
    const audioCtxRef = useRef(null);

    const toggleWindow = (wType) => {
        setSelectedWindows((prev) =>
            prev.includes(wType) ? prev.filter((item) => item !== wType) : [...prev, wType]
        );
    };

    // Live Microphone Stream (Real-time Web App Feature)
    const toggleMicrophone = async () => {
        if (isMicActive) {
            clearInterval(micIntervalRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
            setIsMicActive(false);
            setSignalType('sine');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);

            const buffer = new Float32Array(analyser.fftSize);
            setFs(audioCtx.sampleRate);
            setSignalType('custom');
            setIsMicActive(true);

            micIntervalRef.current = setInterval(() => {
                analyser.getFloatTimeDomainData(buffer);
                setCustomSamples(Array.from(buffer));
            }, 80);
        } catch (err) {
            alert('Microphone permission denied or unavailable.');
        }
    };

    useEffect(() => {
        return () => {
            if (micIntervalRef.current) clearInterval(micIntervalRef.current);
        };
    }, []);

    // File Upload (.wav / .csv)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCustomFileName(file.name);

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            const text = await file.text();
            const nums = text.split(/[\s,]+/).map(parseFloat).filter((v) => !isNaN(v));
            if (nums.length > 0) {
                setCustomSamples(nums);
                setSignalType('custom');
            }
        } else {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            const startOffset = Math.min(1000, Math.floor(channelData.length / 4));
            setCustomSamples(Array.from(channelData.slice(startOffset, startOffset + 512)));
            setFs(audioCtx.sampleRate);
            setSignalType('custom');
        }
    };

    // Viva Presets
    const applyPreset = (preset) => {
        if (isMicActive) toggleMicrophone();
        setFs(1000);
        setN(64);
        if (preset === 'coherent') {
            setSignalType('sine');
            setF1(156.25); // 10.0 cycles
        } else if (preset === 'leakage') {
            setSignalType('sine');
            setF1(164.06); // 10.5 cycles
        } else if (preset === 'twotone') {
            setSignalType('dualsine');
            setF1(164.06);
            setF2(234.38);
            setAmp2(0.05);
        }
    };

    const { timeData, spectrumData, metricsList } = useMemo(() => {
        const N_fft = 2048;
        const rawSignal = generateSignal({ signalType, N, fs, f1, f2, amp2, customSamples });
        const timeWin = generateWindow(activeTimeWindow, N);

        const tData = [];
        for (let n = 0; n < N; n++) {
            tData.push({
                sample: n,
                raw: Number(rawSignal[n].toFixed(4)),
                window: Number(timeWin[n].toFixed(4)),
                windowed: Number((rawSignal[n] * timeWin[n]).toFixed(4))
            });
        }

        const spectraByWindow = {};
        const mList = [];

        selectedWindows.forEach((wType) => {
            const w = generateWindow(wType, N);
            const windowedSig = new Float64Array(N);
            for (let n = 0; n < N; n++) windowedSig[n] = rawSignal[n] * w[n];
            const magDB = computeMagnitudeSpectrumDB(windowedSig, N_fft);
            spectraByWindow[wType] = magDB;
            mList.push(quantifyWindowMetrics(wType, N, fs, magDB, 8192));
        });

        const halfBins = N_fft >> 1;
        const sData = [];
        for (let k = 0; k < halfBins; k += 2) {
            const freq = Number(((k * fs) / N_fft).toFixed(1));
            const point = { freq };
            selectedWindows.forEach((wType) => {
                point[wType] = Number(spectraByWindow[wType][k].toFixed(2));
            });
            sData.push(point);
        }

        return { timeData: tData, spectrumData: sData, metricsList: mList };
    }, [signalType, N, fs, f1, f2, amp2, selectedWindows, activeTimeWindow, customSamples]);

    // Export CSV for Project Report
    const exportMetricsCSV = () => {
        const headers = ['Window,3dB_Width_Hz,3dB_Width_Bins,Null_Width_Hz,Null_Width_Bins,Peak_SideLobe_dB,Detected_Peak_Hz'];
        const rows = metricsList.map(
            (m) => `${m.windowType},${m.width3dB_Hz},${m.width3dB_Bins},${m.nullWidth_Hz},${m.nullWidth_Bins},${m.peakSideLobe_dB},${m.detectedFreqHz}`
        );
        const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SP09_Window_Metrics_N${N}.csv`;
        a.click();
    };

    const binSpacing = (fs / N).toFixed(2);
    const exactBinCount = ((f1 * N) / fs).toFixed(2);

    return (
        <div className="app-shell">
            {/* Top Application Bar */}
            <header className="topbar">
                <div className="brand">
                    <span className="app-badge">SP09 LAB</span>
                    <span>Windowing & Spectral Leakage Workbench</span>
                </div>
                <div className="toolbar-actions">
                    <button className="btn" onClick={() => applyPreset('coherent')}>Preset 1: Coherent (10.0 Bins)</button>
                    <button className="btn" onClick={() => applyPreset('leakage')}>Preset 2: Leakage (10.5 Bins)</button>
                    <button className="btn" onClick={() => applyPreset('twotone')}>Preset 3: 2-Tone Masking</button>
                    <button className={`btn ${isMicActive ? 'btn-danger' : ''}`} onClick={toggleMicrophone}>
                        {isMicActive ? '● Stop Live Mic' : '🎤 Live Mic Input'}
                    </button>
                    <button className="btn btn-primary" onClick={exportMetricsCSV}>⬇ Export CSV</button>
                </div>
            </header>

            {/* Main Docked Workspace */}
            <div className="workspace">
                {/* Left Instrument Rack */}
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

                {/* Tabbed Main Instrument Viewport */}
                <main className="viewport">
                    <div className="tab-bar">
                        <button
                            className={`tab-btn ${activeTab === 'workbench' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workbench')}
                        >
                            📊 Split Workbench (Plots + Metrics)
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'spectrum' ? 'active' : ''}`}
                            onClick={() => setActiveTab('spectrum')}
                        >
                            🔍 Full-Screen Spectrum & Time Domain
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('metrics')}
                        >
                            📋 Lobe Quantification & Viva Reference
                        </button>
                    </div>

                    <div className="viewport-content">
                        {(activeTab === 'workbench' || activeTab === 'spectrum') && (
                            <>
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <span>Zero-Padded Magnitude Spectrum |X(f)| (Normalized dB)</span>
                                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>FFT Size: 2048 pts | fs: {fs} Hz</span>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 220, position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                                            <LineChart data={spectrumData} margin={{ top: 5, right: 20, bottom: 10, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                                <XAxis dataKey="freq" stroke="#9ca3af" type="number" domain={[0, fs / 2]} tickCount={11} />
                                                <YAxis domain={[-100, 0]} ticks={[0, -20, -40, -60, -80, -100]} stroke="#9ca3af" />
                                                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                                                <Legend verticalAlign="top" height={28} />
                                                {selectedWindows.map((wType) => (
                                                    <Line
                                                        key={wType}
                                                        type="monotone"
                                                        dataKey={wType}
                                                        stroke={WINDOW_COLORS[wType]}
                                                        strokeWidth={2}
                                                        dot={false}
                                                        isAnimationActive={false}
                                                    />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {activeTab === 'spectrum' && (
                                    <div className="chart-card">
                                        <div className="chart-header">
                                            <span>Time-Domain Tapered Signal: x[n] · w[n] ({activeTimeWindow})</span>
                                        </div>
                                        <div style={{ flex: 1, minHeight: 180, position: 'relative' }}>
                                            <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                                                <LineChart data={timeData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                                    <XAxis dataKey="sample" stroke="#9ca3af" />
                                                    <YAxis domain={[-1.5, 1.5]} stroke="#9ca3af" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                                                    <Legend verticalAlign="top" height={28} />
                                                    <Line type="monotone" dataKey="raw" name="Input x[n]" stroke="#6b7280" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="window" name="Window w[n]" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                    <Line type="monotone" dataKey="windowed" name="Windowed Output" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {(activeTab === 'workbench' || activeTab === 'metrics') && (
                            <div className="chart-card" style={{ flex: activeTab === 'metrics' ? 1 : 'unset' }}>
                                <div className="chart-header">
                                    <span>Real-Time Quantified Lobe Metrics (N = {N}, Δf = {binSpacing} Hz)</span>
                                </div>
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
                                        {metricsList.map((m) => (
                                            <tr key={m.windowType}>
                                                <td>
                                                    <span className="color-dot" style={{ backgroundColor: WINDOW_COLORS[m.windowType], display: 'inline-block', marginRight: 8 }} />
                                                    <strong>{m.windowType}</strong>
                                                </td>
                                                <td>{m.width3dB_Hz} Hz ({m.width3dB_Bins} bins)</td>
                                                <td>{m.nullWidth_Hz} Hz ({m.nullWidth_Bins} bins)</td>
                                                <td>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            backgroundColor: Number(m.peakSideLobe_dB) < -40 ? '#065f46' : Number(m.peakSideLobe_dB) < -25 ? '#1e40af' : '#7f1d1d',
                                                            color: '#fff'
                                                        }}
                                                    >
                                                        {m.peakSideLobe_dB} dB
                                                    </span>
                                                </td>
                                                <td>{m.detectedFreqHz} Hz</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Bottom Instrument Status Bar */}
            <footer className="statusbar">
                <span>STATUS: {isMicActive ? 'LIVE MICROPHONE STREAMING' : 'SYNTHETIC / FILE ENGINE READY'}</span>
                <span>DFT BIN RESOLUTION (fs/N): {binSpacing} Hz | ZERO-PADDED FFT: 8192 BINS</span>
                <span>IITM BS ELECTRONIC SYSTEMS — SP09 WORKBENCH</span>
            </footer>
        </div>
    );
}