// src/App.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    WINDOW_SPECS,
    WINDOW_TYPES,
    generateSignal,
    computeSpectrum,
    quantifyWindowMetrics
} from './dspEngine';
import TopBar from './components/TopBar';
import TelemetryBar from './components/TelemetryBar';
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

    // Sidebar drawer state: on mobile touch / portrait, start closed for 100% chart width
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
            const isPortrait = window.innerHeight > window.innerWidth;
            if (isTouch || isPortrait || window.innerWidth < 1024) {
                return false;
            }
            return true;
        }
        return true;
    });

    const [activePreset, setActivePreset] = useState('leakage'); // 'coherent' | 'leakage' | 'twotone' | 'zeropad' | null

    // DSP Parameters (matching & extending Ahmad's SPEC-01)
    const [signalType, setSignalType] = useState('sine');
    const [f0, setF0] = useState(50.0);
    const [fs, setFs] = useState(1000);
    const [duration, setDuration] = useState(0.21); // 0.21 sec -> N = 210 samples
    const [primaryWindow, setPrimaryWindow] = useState('Hann');
    const [compareWindow, setCompareWindow] = useState('Rectangular');
    const [overlayMode, setOverlayMode] = useState('ch1_ch2'); // 'ch1_ch2' | 'all_windows'
    const [selectedWindows, setSelectedWindows] = useState(['Rectangular', 'Hann', 'Hamming', 'Blackman']);
    const [zeroPadFactor, setZeroPadFactor] = useState(1);
    const [magScale, setMagScale] = useState('db'); // 'db' | 'linear'

    // Audio / File / Live Mic input
    const [customSamples, setCustomSamples] = useState(null);
    const [customFileName, setCustomFileName] = useState('');
    const [isMicActive, setIsMicActive] = useState(false);

    const micIntervalRef = useRef(null);
    const audioCtxRef = useRef(null);

    // Sync theme to root DOM
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
        setActivePreset(null);
        setSelectedWindows((prev) =>
            prev.includes(wType) ? prev.filter((item) => item !== wType) : [...prev, wType]
        );
    };

    // Live Microphone Stream
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
            setDuration(buffer.length / audioCtx.sampleRate);
            setSignalType('custom');
            setActivePreset(null);
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
                setDuration(nums.length / fs);
                setSignalType('custom');
                setActivePreset(null);
            }
        } else {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            const numSamples = Math.min(1024, channelData.length);
            const startOffset = Math.min(1000, Math.floor(channelData.length / 4));
            setCustomSamples(Array.from(channelData.slice(startOffset, startOffset + numSamples)));
            setFs(audioCtx.sampleRate);
            setDuration(numSamples / audioCtx.sampleRate);
            setSignalType('custom');
            setActivePreset(null);
        }
    };

    // Reference Setups matching Ahmad's exact presets
    const applyPreset = (preset) => {
        if (isMicActive) toggleMicrophone();
        setFs(1000);
        setActivePreset(preset);

        if (preset === 'coherent') {
            setSignalType('sine');
            setF0(50.0);
            setDuration(0.20); // 200 samples -> exactly 10.000 cycles
            setPrimaryWindow('Rectangular');
            setCompareWindow('none');
            setOverlayMode('ch1_ch2');
            setZeroPadFactor(1);
            setMagScale('db');
        } else if (preset === 'leakage') {
            setSignalType('sine');
            setF0(50.0);
            setDuration(0.21); // 210 samples -> exactly 10.500 cycles (half-bin leakage)
            setPrimaryWindow('Hann');
            setCompareWindow('Rectangular');
            setOverlayMode('ch1_ch2');
            setZeroPadFactor(1);
            setMagScale('db');
        } else if (preset === 'twotone') {
            setSignalType('two_tone');
            setF0(50.0);
            setDuration(0.21);
            setPrimaryWindow('Blackman');
            setCompareWindow('Rectangular');
            setOverlayMode('ch1_ch2');
            setZeroPadFactor(2);
            setMagScale('db');
        } else if (preset === 'zeropad') {
            setSignalType('sine');
            setF0(50.0);
            setDuration(0.15); // 150 samples -> 7.5 cycles
            setPrimaryWindow('Rectangular');
            setCompareWindow('Hann');
            setOverlayMode('ch1_ch2');
            setZeroPadFactor(8);
            setMagScale('db');
        }
    };

    // Manual setters that unlatch activePreset when user customizes parameters
    const onSetF0 = (val) => { setF0(val); setActivePreset(null); };
    const onSetDuration = (val) => { setDuration(val); setActivePreset(null); };
    const onSetFs = (val) => { setFs(val); setActivePreset(null); };
    const onSetSignalType = (val) => { setSignalType(val); setActivePreset(null); };
    const onSetPrimaryWindow = (val) => { setPrimaryWindow(val); setActivePreset(null); };
    const onSetCompareWindow = (val) => { setCompareWindow(val); setActivePreset(null); };
    const onSetZeroPadFactor = (val) => { setZeroPadFactor(val); setActivePreset(null); };
    const onSetOverlayMode = (val) => { setOverlayMode(val); setActivePreset(null); };

    // Exact Sample count N (arbitrary integer)
    const N = Math.max(16, Math.round(fs * duration));
    const actualT = N / fs;
    const cycles = f0 * actualT;
    const isCoherent = Math.abs(cycles - Math.round(cycles)) < 1e-4;

    // Core DSP computation
    const { timeData, spectrumData, metricsList, ch1Psll, leakedPowerRatio, nFFT } = useMemo(() => {
        const x = generateSignal(signalType, N, fs, f0, 250, 0.025, customSamples);

        // 1. Primary CH1 Spectrum
        const ch1 = computeSpectrum(x, primaryWindow, fs, zeroPadFactor);

        // 2. Reference CH2 Spectrum
        const ch2 = (compareWindow !== 'none' && compareWindow !== primaryWindow)
            ? computeSpectrum(x, compareWindow, fs, zeroPadFactor)
            : null;

        // 3. Multi-Window spectra (if all_windows mode)
        const multiSpectra = {};
        if (overlayMode === 'all_windows') {
            selectedWindows.forEach((w) => {
                multiSpectra[w] = computeSpectrum(x, w, fs, zeroPadFactor);
            });
        }

        // Time Domain Trace data (x[n], envelope w[n], windowed signal y[n])
        const tData = [];
        const step = N > 512 ? Math.ceil(N / 512) : 1;
        for (let n = 0; n < N; n += step) {
            tData.push({
                sample: n,
                time: Number((n / fs).toFixed(4)),
                raw: Number(x[n].toFixed(3)),
                envelope: Number(ch1.w[n].toFixed(3)),
                windowed: Number(ch1.y[n].toFixed(3))
            });
        }

        // Frequency Domain Spectrum data
        const isDb = magScale === 'db';
        const numBins = ch1.freqs.length;
        const sData = [];
        const freqStep = numBins > 1024 ? Math.ceil(numBins / 1024) : 1;

        for (let k = 0; k < numBins; k += freqStep) {
            const freq = Number(ch1.freqs[k].toFixed(1));
            const point = {
                freq,
                CH1: Number((isDb ? ch1.magDb[k] : ch1.magLinear[k]).toFixed(2))
            };

            if (ch2) {
                point.CH2 = Number((isDb ? ch2.magDb[k] : ch2.magLinear[k]).toFixed(2));
            }

            if (overlayMode === 'all_windows') {
                selectedWindows.forEach((w) => {
                    if (multiSpectra[w]) {
                        point[w] = Number((isDb ? multiSpectra[w].magDb[k] : multiSpectra[w].magLinear[k]).toFixed(2));
                    }
                });
            }

            sData.push(point);
        }

        // Benchmark quantification metrics across all windows
        const mList = WINDOW_TYPES.map((wType) => {
            const spec = computeSpectrum(x, wType, fs, 4);
            const m = quantifyWindowMetrics(wType, N, fs, spec.magDb, 4096);
            m.leakedPowerRatio = spec.leakedPowerRatio;
            return m;
        });

        return {
            timeData: tData,
            spectrumData: sData,
            metricsList: mList,
            ch1Psll: ch1.spec.psll,
            leakedPowerRatio: ch1.leakedPowerRatio,
            nFFT: ch1.nFFT
        };
    }, [signalType, N, fs, f0, duration, primaryWindow, compareWindow, overlayMode, selectedWindows, zeroPadFactor, magScale, customSamples]);

    // Export CSV
    const exportMetricsCSV = () => {
        const headers = ['Window,Theoretical_PSLL,3dB_Width_Hz,3dB_Width_Bins,Null_Width_Hz,Null_Width_Bins,Measured_PSL_dB,Leaked_Power_Ratio_Pct,Detected_Peak_Hz'];
        const rows = metricsList.map(
            (m) => `${m.windowType},${WINDOW_SPECS[m.windowType]?.psll || '--'},${m.width3dB_Hz},${m.width3dB_Bins},${m.nullWidth_Hz},${m.nullWidth_Bins},${m.peakSideLobe_dB},${m.leakedPowerRatio?.toFixed(2) || '0.00'},${m.detectedFreqHz}`
        );
        const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPEC01_Spectral_Leakage_N${N}_T${duration.toFixed(3)}s.csv`;
        a.click();
    };

    const binSpacing = (fs / N).toFixed(2);

    return (
        <div className="app-shell">
            <TopBar
                applyPreset={applyPreset}
                activePreset={activePreset}
                isMicActive={isMicActive}
                toggleMicrophone={toggleMicrophone}
                exportMetricsCSV={exportMetricsCSV}
                theme={theme}
                toggleTheme={toggleTheme}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            {/* Swiss Lab-Bench Telemetry Strip */}
            <TelemetryBar
                N={N}
                nFFT={nFFT}
                cycles={cycles}
                isCoherent={isCoherent}
                ch1Psll={ch1Psll}
                leakedPowerRatio={leakedPowerRatio}
            />

            <div className="workspace">
                {/* Mobile backdrop to dismiss sidebar drawer */}
                {isSidebarOpen && (
                    <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
                )}

                <InstrumentRack
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    signalType={signalType}
                    setSignalType={onSetSignalType}
                    f0={f0}
                    setF0={onSetF0}
                    fs={fs}
                    setFs={onSetFs}
                    duration={duration}
                    setDuration={onSetDuration}
                    N={N}
                    primaryWindow={primaryWindow}
                    setPrimaryWindow={onSetPrimaryWindow}
                    compareWindow={compareWindow}
                    setCompareWindow={onSetCompareWindow}
                    zeroPadFactor={zeroPadFactor}
                    setZeroPadFactor={onSetZeroPadFactor}
                    magScale={magScale}
                    setMagScale={setMagScale}
                    selectedWindows={selectedWindows}
                    toggleWindow={toggleWindow}
                    overlayMode={overlayMode}
                    setOverlayMode={onSetOverlayMode}
                    customFileName={customFileName}
                    handleFileUpload={handleFileUpload}
                />

                <main className="viewport">
                    <div className="viewport-content">
                        {/* TRACE A: Time Domain Windowing */}
                        <TimeDomainChart
                            timeData={timeData}
                            primaryWindow={primaryWindow}
                            theme={theme}
                        />

                        {/* TRACE B: Frequency Domain Spectrum */}
                        <SpectrumChart
                            spectrumData={spectrumData}
                            overlayMode={overlayMode}
                            primaryWindow={primaryWindow}
                            compareWindow={compareWindow}
                            selectedWindows={selectedWindows}
                            fs={fs}
                            magScale={magScale}
                            theme={theme}
                        />

                        {/* BENCHMARK TABLE: Real-Time Quantified Window Metrics */}
                        <MetricsTable
                            metricsList={metricsList}
                            N={N}
                            binSpacing={binSpacing}
                            theme={theme}
                        />
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
