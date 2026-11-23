/**
 * ===================================================================================================
 *  SP09: WINDOWING EFFECTS ON SPECTRAL LEAKAGE ANALYZER — PURE JS DSP ENGINE
 * ===================================================================================================
 * 
 *  Theoretical Context (Academic Reference for DSP Lab & Viva):
 *  ------------------------------------------------------------
 *  1. Finite-Length Windowing & Leakage:
 *     In practical DSP, observing an analog or discrete signal x[n] over a finite duration of N samples
 *     is mathematically equivalent to multiplying the infinite signal by a window function w[n]:
 *         x_w[n] = x[n] · w[n],   n = 0, 1, ..., N - 1
 *     By the Fourier Modulation / Convolution theorem, multiplication in the discrete-time domain
 *     corresponds to circular/periodic convolution in the continuous frequency domain (DTFT):
 *         X_w(e^{jω}) = (1 / 2π) · X(e^{jω}) ⊛ W(e^{jω})
 *     
 *     If the input sinusoid has an integer number of cycles within N samples (coherent sampling), its
 *     DTFT energy falls precisely on DFT bin centers, and all window sidelobes cross zero at adjacent bins.
 *     However, when the signal frequency is non-integer (non-coherent sampling), the energy spills into
 *     all neighboring DFT frequency bins. This phenomenon is known as "Spectral Leakage".
 * 
 *  2. The Window Tradeoff (Main-Lobe Width vs. Peak Side-Lobe Level):
 *     - Rectangular Window: Sharpest main-lobe (0.89 bin -3 dB width), but severe discontinuities at
 *       the edges create high side lobes (-13.3 dB PSL) decaying slowly at -6 dB/octave.
 *     - Tapered Windows (Bartlett, Hann, Hamming, Blackman): Smoothly decay to zero at boundaries,
 *       drastically suppressing side-lobe leakage (e.g., -31.5 dB for Hann, -42.7 dB for Hamming,
 *       -58.1 dB for Blackman), at the cost of broadening the main lobe (reducing frequency resolution).
 * 
 *  3. Zero-Padding FFT:
 *     Zero-padding an N-point windowed sequence to N_fft points (e.g., 2048 or 8192) does NOT increase
 *     physical frequency resolution (which is governed strictly by the record length N · Ts), but it
 *     evaluates the DTFT at denser frequency samples on the unit circle, revealing the exact continuous
 *     lobes and sidelobe structure without picket-fence scalloping distortion.
 * ===================================================================================================
 */

/**
 * Standard DSP Window Types supported by the analyzer
 */
export const WINDOW_TYPES = ['Rectangular', 'Hann', 'Hamming', 'Blackman', 'Bartlett'];

/**
 * High-contrast visualization color map for spectral overlay plots
 */
export const WINDOW_COLORS = {
    'Rectangular': '#ef4444', // Red / Crimson
    'Bartlett': '#f59e0b',    // Amber / Gold
    'Hann': '#10b981',        // Emerald / Green
    'Hamming': '#38bdf8',     // Sky Blue / Cyan
    'Blackman': '#a855f7'     // Purple / Violet
};

/**
 * Generates symmetric discrete window coefficients w[n] for n = 0, ..., N - 1.
 *
 * Mathematical Formulations:
 * - Rectangular: w[n] = 1.0
 * - Bartlett (Triangular): w[n] = 1.0 - |2n - (N-1)| / (N-1)
 * - Hann: w[n] = 0.5 - 0.5 · cos(2πn / (N-1))
 * - Hamming: w[n] = 0.54 - 0.46 · cos(2πn / (N-1))
 * - Blackman: w[n] = 0.42 - 0.5 · cos(2πn / (N-1)) + 0.08 · cos(4πn / (N-1))
 *
 * @param {string} wType - Name of the window ('Rectangular', 'Hann', 'Hamming', 'Blackman', 'Bartlett')
 * @param {number} N - Length of the window in samples
 * @returns {Float64Array} Window coefficients of length N
 */
export function generateWindow(wType, N) {
    const w = new Float64Array(N);
    if (N <= 1) {
        if (N === 1) w[0] = 1.0;
        return w;
    }

    const denom = N - 1;
    const twoPiOverDenom = (2.0 * Math.PI) / denom;
    const fourPiOverDenom = (4.0 * Math.PI) / denom;

    switch (wType) {
        case 'Rectangular':
            w.fill(1.0);
            break;

        case 'Bartlett':
            for (let n = 0; n < N; n++) {
                w[n] = 1.0 - Math.abs((2.0 * n - denom) / denom);
            }
            break;

        case 'Hann':
            for (let n = 0; n < N; n++) {
                w[n] = 0.5 - 0.5 * Math.cos(twoPiOverDenom * n);
            }
            break;

        case 'Hamming':
            for (let n = 0; n < N; n++) {
                w[n] = 0.54 - 0.46 * Math.cos(twoPiOverDenom * n);
            }
            break;

        case 'Blackman':
            for (let n = 0; n < N; n++) {
                w[n] = 0.42 - 0.5 * Math.cos(twoPiOverDenom * n) + 0.08 * Math.cos(fourPiOverDenom * n);
            }
            break;

        default:
            w.fill(1.0);
            break;
    }

    return w;
}

/**
 * Generates synthetic or extracts custom discrete-time signals x[n] of length N.
 *
 * @param {Object} params - Signal configuration options
 * @param {string} params.signalType - 'sine' | 'dualsine' | 'square' | 'chirp' | 'custom'
 * @param {number} params.N - Number of samples
 * @param {number} params.fs - Sampling frequency (Hz)
 * @param {number} params.f1 - Fundamental frequency 1 (Hz)
 * @param {number} params.f2 - Secondary frequency 2 (Hz)
 * @param {number} params.amp2 - Relative amplitude of tone 2 (linear gain)
 * @param {Array<number>|Float32Array|Float64Array} [params.customSamples] - User uploaded or streamed samples
 * @returns {Float64Array} Signal samples of length N
 */
export function generateSignal({ signalType, N, fs, f1, f2, amp2 = 0.1, customSamples }) {
    const x = new Float64Array(N);

    if (signalType === 'custom' && customSamples && customSamples.length > 0) {
        const copyLen = Math.min(N, customSamples.length);
        for (let i = 0; i < copyLen; i++) {
            x[i] = Number(customSamples[i]) || 0;
        }
        return x;
    }

    const Ts = 1.0 / fs;

    switch (signalType) {
        case 'sine':
            for (let n = 0; n < N; n++) {
                const t = n * Ts;
                x[n] = Math.sin(2.0 * Math.PI * f1 * t);
            }
            break;

        case 'dualsine':
            for (let n = 0; n < N; n++) {
                const t = n * Ts;
                x[n] = Math.sin(2.0 * Math.PI * f1 * t) + amp2 * Math.sin(2.0 * Math.PI * f2 * t);
            }
            break;

        case 'square':
            for (let n = 0; n < N; n++) {
                const t = n * Ts;
                const s = Math.sin(2.0 * Math.PI * f1 * t);
                x[n] = s >= 0 ? 1.0 : -1.0;
            }
            break;

        case 'chirp': {
            // Linear frequency modulation: instantaneous frequency sweeps f1 -> f2 across total duration T
            const T = N * Ts;
            const chirpRate = (f2 - f1) / (2.0 * T);
            for (let n = 0; n < N; n++) {
                const t = n * Ts;
                const phase = 2.0 * Math.PI * (f1 * t + chirpRate * t * t);
                x[n] = Math.sin(phase);
            }
            break;
        }

        default:
            for (let n = 0; n < N; n++) {
                const t = n * Ts;
                x[n] = Math.sin(2.0 * Math.PI * f1 * t);
            }
            break;
    }

    return x;
}

/**
 * Pure JavaScript In-Place Radix-2 Cooley-Tukey Fast Fourier Transform (Decimation-in-Time).
 * 
 * Mathematical Formulation:
 * -------------------------
 * Computes the Discrete Fourier Transform:
 *     X[k] = \sum_{n=0}^{N-1} x[n] · e^{-j · 2π · k · n / N},   k = 0, 1, ..., N - 1
 * 
 * Algorithm Steps:
 * 1. Bit-Reversal Permutation: Reorders input data so that time samples are decimated
 *    into odd and even sub-sequences in O(N) operations.
 * 2. Butterfly Computations: Combines 2-point, 4-point, ..., N-point sub-transforms
 *    using precalculated complex twiddle factors W_N^k = e^{-j · 2π · k / N}.
 *    Overall computational complexity is reduced from O(N^2) to O(N log2 N).
 * 
 * @param {Float64Array} real - Real part of complex sequence (length must be power of 2)
 * @param {Float64Array} imag - Imaginary part of complex sequence (length must be power of 2)
 */
function cooleyTukeyFFT(real, imag) {
    const n = real.length;

    // 1. Bit-reversal permutation
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
        if (i < j) {
            const tr = real[i]; real[i] = real[j]; real[j] = tr;
            const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
        }
        let k = n >> 1;
        while (k <= j) {
            j -= k;
            k >>= 1;
        }
        j += k;
    }

    // 2. Radix-2 Butterfly stages (log2(n) iterations)
    for (let len = 2; len <= n; len <<= 1) {
        const halfLen = len >> 1;
        const angle = (-2.0 * Math.PI) / len;
        const wStepReal = Math.cos(angle);
        const wStepImag = Math.sin(angle);

        for (let i = 0; i < n; i += len) {
            let wReal = 1.0;
            let wImag = 0.0;

            for (let k = 0; k < halfLen; k++) {
                const uReal = real[i + k];
                const uImag = imag[i + k];

                const vReal = real[i + k + halfLen] * wReal - imag[i + k + halfLen] * wImag;
                const vImag = real[i + k + halfLen] * wImag + imag[i + k + halfLen] * wReal;

                real[i + k] = uReal + vReal;
                imag[i + k] = uImag + vImag;
                real[i + k + halfLen] = uReal - vReal;
                imag[i + k + halfLen] = uImag - vImag;

                const nextWReal = wReal * wStepReal - wImag * wStepImag;
                const nextWImag = wReal * wStepImag + wImag * wStepReal;
                wReal = nextWReal;
                wImag = nextWImag;
            }
        }
    }
}

/**
 * Computes the zero-padded magnitude spectrum in normalized decibels (dB).
 * 
 * The zero-padded sequence x_pad of length N_fft is processed through the Radix-2 FFT.
 * Magnitude values |X[k]| are normalized relative to the maximum spectral peak:
 *     Mag_dB[k] = 20 · log10( |X[k]| / max(|X|) )
 * 
 * This normalization ensures that the main peak is fixed at 0 dB, providing an immediate,
 * standardized baseline to compare side-lobe attenuation across different window types.
 *
 * @param {Float64Array|Array<number>} windowedSig - Windowed time-domain sequence of length N
 * @param {number} N_fft - Desired FFT size (must be power of 2, e.g., 2048 or 8192)
 * @returns {Float64Array} Normalized magnitude spectrum in dB (clamped to [-100, 0] dB)
 */
export function computeMagnitudeSpectrumDB(windowedSig, N_fft = 2048) {
    // Ensure power of 2
    let nPowerOf2 = 1;
    while (nPowerOf2 < N_fft) nPowerOf2 <<= 1;
    const fftSize = nPowerOf2;

    const real = new Float64Array(fftSize);
    const imag = new Float64Array(fftSize);

    // Copy windowed sequence into real buffer; remaining elements are 0 (zero-padding)
    const copyLen = Math.min(windowedSig.length, fftSize);
    for (let i = 0; i < copyLen; i++) {
        real[i] = windowedSig[i];
    }

    // Execute pure Radix-2 Cooley-Tukey FFT
    cooleyTukeyFFT(real, imag);

    // Compute linear magnitudes
    const mag = new Float64Array(fftSize);
    let maxMag = 0.0;
    for (let k = 0; k < fftSize; k++) {
        const m = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
        mag[k] = m;
        if (m > maxMag) maxMag = m;
    }

    // Compute normalized magnitude spectrum in dB
    const magDB = new Float64Array(fftSize);
    const floorDB = -100.0; // Clamped display floor matching Recharts Y-axis domain [-100, 5]

    if (maxMag <= 1e-12) {
        magDB.fill(floorDB);
        return magDB;
    }

    for (let k = 0; k < fftSize; k++) {
        const ratio = mag[k] / maxMag;
        if (ratio <= 1e-5) {
            magDB[k] = floorDB;
        } else {
            const db = 20.0 * Math.log10(ratio);
            magDB[k] = db < floorDB ? floorDB : db;
        }
    }

    return magDB;
}

/**
 * Quantifies academic DSP window metrics:
 * 1. -3 dB Main-Lobe Width (in Hz and DFT bins)
 * 2. Null-to-Null Main-Lobe Width (in Hz and DFT bins)
 * 3. Peak Side-Lobe Level (PSL in dB relative to 0 dB main peak)
 * 4. Detected Fundamental Signal Peak (Hz, sub-bin parabolic interpolation)
 *
 * @param {string} wType - Window function name
 * @param {number} N - Window length in samples
 * @param {number} fs - Sampling frequency in Hz
 * @param {Float64Array} magDB - Magnitude spectrum of windowed signal (from computeMagnitudeSpectrumDB)
 * @param {number} [N_interp=8192] - Interpolated high-resolution FFT size for analytical precision
 * @returns {Object} Metric properties matching App.jsx keys
 */
export function quantifyWindowMetrics(wType, N, fs, magDB, N_interp = 8192) {
    // 1. High-Resolution Analysis of the Window Function w[n]
    const w = generateWindow(wType, N);
    const real = new Float64Array(N_interp);
    const imag = new Float64Array(N_interp);
    real.set(w);

    cooleyTukeyFFT(real, imag);

    // For standard positive symmetric windows, the maximum DC gain is at k = 0
    const maxWinMag = Math.sqrt(real[0] * real[0] + imag[0] * imag[0]);
    const halfInterp = N_interp >> 1;
    const winDB = new Float64Array(halfInterp);

    for (let k = 0; k < halfInterp; k++) {
        const m = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
        winDB[k] = 20.0 * Math.log10(Math.max(m / maxWinMag, 1e-12));
    }

    // A. Calculate -3 dB Main-Lobe Width (Two-Sided)
    // Find bin where winDB crosses -3.0103 dB and apply linear interpolation
    let k3dB = 0.0;
    for (let k = 1; k < halfInterp; k++) {
        if (winDB[k] <= -3.0103) {
            const frac = (-3.0103 - winDB[k - 1]) / (winDB[k] - winDB[k - 1]);
            k3dB = (k - 1) + frac;
            break;
        }
    }
    const width3dB_Hz = 2.0 * k3dB * (fs / N_interp);
    const width3dB_Bins = width3dB_Hz / (fs / N);

    // B. Calculate Null-to-Null Main-Lobe Width (Two-Sided)
    // Theoretical main-lobe half-width:
    // Rectangular = 1 bin (null-to-null = 2 bins)
    // Bartlett, Hann, Hamming = 2 bins (null-to-null = 4 bins)
    // Blackman = 3 bins (null-to-null = 6 bins)
    const expectedHalfBins = (wType === 'Rectangular') ? 1.0 : (wType === 'Blackman' ? 3.0 : 2.0);
    const binsPerInterp = N_interp / N;
    const searchStart = Math.max(1, Math.round(expectedHalfBins * binsPerInterp * 0.70));
    const searchEnd = Math.min(halfInterp - 1, Math.round(expectedHalfBins * binsPerInterp * 1.35));

    let kNull = Math.round(expectedHalfBins * binsPerInterp);
    let minVal = 0.0;
    for (let k = searchStart; k <= searchEnd; k++) {
        if (winDB[k] < minVal) {
            minVal = winDB[k];
            kNull = k;
        }
    }
    const nullWidth_Hz = 2.0 * kNull * (fs / N_interp);
    const nullWidth_Bins = nullWidth_Hz / (fs / N);

    // C. Peak Side-Lobe Level (PSL in dB):
    // Highest side lobe occurring beyond the main-lobe null boundary
    let maxSidelobe = -100.0;
    const sidelobeStart = kNull + 3;
    for (let k = sidelobeStart; k < halfInterp; k++) {
        if (winDB[k] > maxSidelobe) {
            maxSidelobe = winDB[k];
        }
    }

    // D. Detect Signal Peak Frequency with Sub-Bin Parabolic Interpolation
    let detectedFreqHz = 0.0;
    if (magDB && magDB.length > 0) {
        const halfBins = magDB.length >> 1;
        let peakIdx = 0;
        let maxVal = -Infinity;

        for (let k = 0; k < halfBins; k++) {
            if (magDB[k] > maxVal) {
                maxVal = magDB[k];
                peakIdx = k;
            }
        }

        if (peakIdx > 0 && peakIdx < halfBins - 1) {
            const alpha = magDB[peakIdx - 1];
            const beta = magDB[peakIdx];
            const gamma = magDB[peakIdx + 1];
            const denom = alpha - 2.0 * beta + gamma;
            const delta = Math.abs(denom) > 1e-9 ? 0.5 * (alpha - gamma) / denom : 0.0;
            detectedFreqHz = (peakIdx + delta) * (fs / magDB.length);
        } else {
            detectedFreqHz = peakIdx * (fs / magDB.length);
        }
    }

    return {
        windowType: wType,
        width3dB_Hz: Number(width3dB_Hz.toFixed(2)),
        width3dB_Bins: Number(width3dB_Bins.toFixed(2)),
        nullWidth_Hz: Number(nullWidth_Hz.toFixed(2)),
        nullWidth_Bins: Number(nullWidth_Bins.toFixed(2)),
        peakSideLobe_dB: Number(maxSidelobe.toFixed(1)),
        detectedFreqHz: Number(detectedFreqHz.toFixed(2))
    };
}
