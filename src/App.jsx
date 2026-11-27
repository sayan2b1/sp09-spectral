// src/App.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    generateWindow,
    generateSignal,
    computeMagnitudeSpectrumDB,
    quantifyWindowMetrics
} from './dspEngine';
import TopBar from './components/TopBar';
import InstrumentRack from './components/InstrumentRack';
import SpectrumChart from './components/SpectrumChart';
import TimeDomainChart from './components/TimeDomainChart';
import MetricsTable from './components/MetricsTable';
import StatusBar from './components/StatusBar';

export default function App() {
    // Theme state (Dark default, persists in localStorage)
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('sp09_theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });

    // Sidebar drawer state (open by default, toggleable on mobile/desktop mode)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth > 860;
        }
        return true;
    });

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

    // Sync theme to root DOM attribute and meta theme-color
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sp09_theme', theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'light' ? '#f1f5f9' : '#090d16');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

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
            alert('Microphone permission denied or unavailable on this device/browser.');
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
        const rawSignal = generateSignal(signalType, N, fs, f1, f2, amp2, customSamples);

        const activeW = generateWindow(activeTimeWindow, N);
        const tData = [];
        for (let n = 0; n < N; n++) {
            tData.push({
                sample: n,
                raw: Number(rawSignal[n].toFixed(3)),
                window: Number(activeW[n].toFixed(3)),
                windowed: Number((rawSignal[n] * activeW[n]).toFixed(3))
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
            <TopBar
                applyPreset={applyPreset}
                isMicActive={isMicActive}
                toggleMicrophone={toggleMicrophone}
                exportMetricsCSV={exportMetricsCSV}
                theme={theme}
                toggleTheme={toggleTheme}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            <div className="workspace">
                {/* Mobile backdrop to dismiss drawer */}
                {isSidebarOpen && (
                    <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
                )}

                <InstrumentRack
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    signalType={signalType}
                    setSignalType={setSignalType}
                    customFileName={customFileName}
                    handleFileUpload={handleFileUpload}
                    N={N}
                    setN={setN}
                    fs={fs}
                    f1={f1}
                    setF1={setF1}
                    f2={f2}
                    setF2={setF2}
                    amp2={amp2}
                    setAmp2={setAmp2}
                    exactBinCount={exactBinCount}
                    selectedWindows={selectedWindows}
                    toggleWindow={toggleWindow}
                    activeTimeWindow={activeTimeWindow}
                    setActiveTimeWindow={setActiveTimeWindow}
                />

                <main className="viewport">
                    <div className="tab-bar">
                        <button
                            className={`tab-btn ${activeTab === 'workbench' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workbench')}
                        >
                            📊 Split Workbench
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'spectrum' ? 'active' : ''}`}
                            onClick={() => setActiveTab('spectrum')}
                        >
                            🔍 Spectrum & Time Waveform
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('metrics')}
                        >
                            📋 Lobe Metrics Reference
                        </button>
                    </div>

                    <div className="viewport-content">
                        {(activeTab === 'workbench' || activeTab === 'spectrum') && (
                            <>
                                <SpectrumChart
                                    spectrumData={spectrumData}
                                    selectedWindows={selectedWindows}
                                    fs={fs}
                                    theme={theme}
                                />
                                {activeTab === 'spectrum' && (
                                    <TimeDomainChart
                                        timeData={timeData}
                                        activeTimeWindow={activeTimeWindow}
                                        theme={theme}
                                    />
                                )}
                            </>
                        )}

                        {(activeTab === 'workbench' || activeTab === 'metrics') && (
                            <MetricsTable
                                metricsList={metricsList}
                                N={N}
                                binSpacing={binSpacing}
                                activeTab={activeTab}
                                theme={theme}
                            />
                        )}
                    </div>
                </main>
            </div>

            <StatusBar
                isMicActive={isMicActive}
                binSpacing={binSpacing}
            />
        </div>
    );
}
