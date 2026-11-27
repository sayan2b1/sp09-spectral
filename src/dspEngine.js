/**
 * ===================================================================================================
 *  SP09 / SPEC-01: ADVANCED DSP ENGINE
 *  Windowing Effects, Spectral Leakage, Bluestein Arbitrary-N FFT, and Telemetry Quantification
 * ===================================================================================================
 * 
 *  Theoretical Framework:
 *  ---------------------
 *  1. Bluestein's Chirp-Z Algorithm:
 *     Computes the exact discrete Fourier transform (DFT) for ANY arbitrary sample count N (prime,
 *     composite, or non-power-of-2 like N = 150, 210) by rewriting the DFT as a circular convolution
 *     using the identity nk = -(k - n)^2 / 2 + n^2 / 2 + k^2 / 2:
 *         X[k] = W^{k^2/2} · sum_{n=0}^{N-1} (x[n] · W^{n^2/2}) · W^{-(k-n)^2/2}
 *     This convolution is evaluated in O(M log M) via zero-padded Radix-2 FFT where M >= 2N - 1.
 * 
 *  2. Coherent Gain (CG) Normalization:
 *     For any window w[n], its DC / coherent gain is defined as:
 *         CG = (1 / N) · sum_{n=0}^{N-1} w[n]
 *     Normalizing single-sided FFT magnitude by (N · CG) ensures that a full-scale sinusoid at the
 *     bin center always has peak magnitude exactly 0 dB (1.0 linear), allowing unbiased side-lobe
 *     and leakage comparisons across different window families.
 * 
 *  3. Leaked Power Ratio (%):
 *     Measures the percentage of total spectral energy falling outside the main-lobe bandwidth:
 *         Leaked Power (%) = max(0, (1 - P_main / P_total) * 100)
 *     When sampling is coherent (integer cycles k = f0 * T), leaked power is 0.00%.
 *     Under half-bin non-coherent conditions, power leaks into all adjacent sidelobes.
 * ===================================================================================================
 */

export const WINDOW_SPECS = {
    'Rectangular': { name: 'Rectangular', psll: '-13.3 dB', mainLobeBins: 1, color: '#ef4444' },
    'Hann':        { name: 'Hann',        psll: '-31.5 dB', mainLobeBins: 2, color: '#10b981' },
    'Hamming':     { name: 'Hamming',     psll: '-42.7 dB', mainLobeBins: 2, color: '#38bdf8' },
    'Blackman':    { name: 'Blackman',    psll: '-58.1 dB', mainLobeBins: 3, color: '#a855f7' },
    'Flat-Top':    { name: 'Flat-Top',    psll: '-93.0 dB', mainLobeBins: 5, color: '#ec4899' },
    'Bartlett':    { name: 'Bartlett',    psll: '-26.5 dB', mainLobeBins: 2, color: '#f59e0b' }
};

export const WINDOW_TYPES = Object.keys(WINDOW_SPECS);

export const WINDOW_COLORS = Object.fromEntries(
    Object.entries(WINDOW_SPECS).map(([k, v]) => [k, v.color])
);

/**
 * Computes window coefficients w[n] of length N.
 */
export function generateWindow(wType, N) {
    const w = new Float64Array(N);
    if (N <= 0) return w;
    if (N === 1) {
        w[0] = 1.0;
        return w;
    }

    if (wType === 'Rectangular') {
        w.fill(1.0);
        return w;
    }

    const twoPi = 2.0 * Math.PI;

    for (let n = 0; n < N; n++) {
        const p = (twoPi * n) / N;
        switch (wType) {
            case 'Hann':
                w[n] = 0.5 * (1.0 - Math.cos(p));
                break;
            case 'Hamming':
                w[n] = 0.54 - 0.46 * Math.cos(p);
                break;
            case 'Blackman':
                w[n] = 0.42 - 0.5 * Math.cos(p) + 0.08 * Math.cos(2.0 * p);
                break;
            case 'Flat-Top':
                // ISO / standard 5-term Flat-Top window for high amplitude calibration
                w[n] = 0.21557895
                     - 0.41663158 * Math.cos(p)
                     + 0.277263158 * Math.cos(2.0 * p)
                     - 0.083578947 * Math.cos(3.0 * p)
                     + 0.006947368 * Math.cos(4.0 * p);
                break;
            case 'Bartlett':
                w[n] = 1.0 - Math.abs((2.0 * n - (N - 1)) / (N - 1));
                break;
            default:
                w[n] = 1.0;
        }
    }
    return w;
}

/**
 * Signal Generator supporting Single Tone, Two-Tone Masking, Square Wave, Multi-Tone, Chirp, and File/Mic.
 */
export function generateSignal(type, N, fs, f0, f2 = 250, amp2 = 0.025, customSamples = null) {
    if (type === 'custom' && customSamples && customSamples.length > 0) {
        const x = new Float64Array(N);
        const len = customSamples.length;
        for (let n = 0; n < N; n++) {
            x[n] = customSamples[n % len];
        }
        return x;
    }

    const x = new Float64Array(N);
    const twoPiF0 = 2.0 * Math.PI * f0;

    for (let n = 0; n < N; n++) {
        const tn = n / fs;
        switch (type) {
            case 'two_tone':
            case 'dualsine':
                // Strong tone (0 dB) + Weak tone (-32 dB at f0 + 18 Hz, or user-selected f2/amp2)
                x[n] = Math.sin(twoPiF0 * tn) + amp2 * Math.sin(2.0 * Math.PI * (f2 || (f0 + 18.0)) * tn);
                break;
            case 'square':
                x[n] = Math.sin(twoPiF0 * tn) >= 0 ? 1.0 : -1.0;
                break;
            case 'multi_tone':
                // 3-Tone composite signal (f0 + 1.5*f0 + 2.2*f0)
                x[n] = Math.sin(twoPiF0 * tn)
                     + 0.4 * Math.sin(2.0 * Math.PI * (f0 * 1.5) * tn)
                     + 0.15 * Math.sin(2.0 * Math.PI * (f0 * 2.2) * tn);
                break;
            case 'chirp':
                // Linear Frequency Modulated chirp from 20 Hz to fs/2 - 20 Hz
                const fStart = 20.0;
                const fEnd = Math.max(fStart + 50.0, fs / 2.0 - 20.0);
                const chirpDuration = N / fs;
                const chirpRate = (fEnd - fStart) / (2.0 * chirpDuration);
                x[n] = Math.sin(2.0 * Math.PI * (fStart * tn + chirpRate * tn * tn));
                break;
            case 'sine':
            default:
                x[n] = Math.sin(twoPiF0 * tn);
                break;
        }
    }
    return x;
}

/**
 * Radix-2 Decimation-In-Time FFT with bit-reversal permutation (in-place).
 */
export function fftRadix2(re, im, inverse = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            const tr = re[i]; re[i] = re[j]; re[j] = tr;
            const ti = im[i]; im[i] = im[j]; im[j] = ti;
        }
    }

    const sign = inverse ? 1.0 : -1.0;
    for (let len = 2; len <= n; len <<= 1) {
        const half = len >> 1;
        const angle = (sign * 2.0 * Math.PI) / len;
        const wLenRe = Math.cos(angle);
        const wLenIm = Math.sin(angle);

        for (let i = 0; i < n; i += len) {
            let wRe = 1.0, wIm = 0.0;
            for (let j = 0; j < half; j++) {
                const uRe = re[i + j], uIm = im[i + j];
                const vRe = re[i + j + half] * wRe - im[i + j + half] * wIm;
                const vIm = re[i + j + half] * wIm + im[i + j + half] * wRe;

                re[i + j] = uRe + vRe;
                im[i + j] = uIm + vIm;
                re[i + j + half] = uRe - vRe;
                im[i + j + half] = uIm - vIm;

                const nextRe = wRe * wLenRe - wIm * wLenIm;
                wIm = wRe * wLenIm + wIm * wLenRe;
                wRe = nextRe;
            }
        }
    }

    if (inverse) {
        for (let i = 0; i < n; i++) {
            re[i] /= n;
            im[i] /= n;
        }
    }
}

/**
 * Bluestein's Arbitrary-Length Exact FFT Algorithm.
 * Allows computing exact N-point DFT for ANY integer N in O(N log N).
 */
export function bluesteinFFT(inputReal) {
    const n = inputReal.length;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    re.set(inputReal);

    // If power of 2, use fast Radix-2 directly
    if ((n & (n - 1)) === 0) {
        fftRadix2(re, im, false);
        return { re, im };
    }

    // Power-of-2 size m >= 2n - 1
    let m = 1;
    while (m < 2 * n - 1) m <<= 1;

    const cosT = new Float64Array(n);
    const sinT = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const angle = (Math.PI * ((i * i) % (2 * n))) / n;
        cosT[i] = Math.cos(angle);
        sinT[i] = Math.sin(angle);
    }

    const aRe = new Float64Array(m);
    const aIm = new Float64Array(m);
    for (let i = 0; i < n; i++) {
        aRe[i] = re[i] * cosT[i] + im[i] * sinT[i];
        aIm[i] = -re[i] * sinT[i] + im[i] * cosT[i];
    }

    const bRe = new Float64Array(m);
    const bIm = new Float64Array(m);
    bRe[0] = cosT[0];
    bIm[0] = sinT[0];
    for (let i = 1; i < n; i++) {
        bRe[i] = bRe[m - i] = cosT[i];
        bIm[i] = bIm[m - i] = sinT[i];
    }

    fftRadix2(aRe, aIm, false);
    fftRadix2(bRe, bIm, false);

    for (let i = 0; i < m; i++) {
        const tmpRe = aRe[i] * bRe[i] - aIm[i] * bIm[i];
        const tmpIm = aRe[i] * bIm[i] + aIm[i] * bRe[i];
        aRe[i] = tmpRe;
        aIm[i] = tmpIm;
    }

    fftRadix2(aRe, aIm, true);

    const outRe = new Float64Array(n);
    const outIm = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        outRe[i] = aRe[i] * cosT[i] + aIm[i] * sinT[i];
        outIm[i] = -aRe[i] * sinT[i] + aIm[i] * cosT[i];
    }
    return { re: outRe, im: outIm };
}

/**
 * Computes single-sided magnitude spectrum with coherent gain normalization, zero-padding,
 * and measures Leaked Power Ratio (%).
 */
export function computeSpectrum(x, windowType, fs, zeroPadFactor = 1) {
    const N = x.length;
    const w = generateWindow(windowType, N);
    const y = new Float64Array(N);

    let cg = 0.0;
    for (let n = 0; n < N; n++) {
        y[n] = x[n] * w[n];
        cg += w[n];
    }
    cg /= N;

    const nFFT = N * zeroPadFactor;
    const padded = new Float64Array(nFFT);
    padded.set(y);

    const { re, im } = bluesteinFFT(padded);
    const numBins = Math.floor(nFFT / 2) + 1;

    const freqs = new Float64Array(numBins);
    const magLinear = new Float64Array(numBins);
    const magDb = new Float64Array(numBins);
    const scale = (N * cg) / 2.0;

    for (let k = 0; k < numBins; k++) {
        freqs[k] = (k * fs) / nFFT;
        const raw = Math.hypot(re[k], im[k]);
        const norm = (k === 0 || (nFFT % 2 === 0 && k === numBins - 1)) ? (N * cg) : scale;
        const lin = raw / Math.max(norm, 1e-12);
        magLinear[k] = lin;
        magDb[k] = 20.0 * Math.log10(Math.max(lin, 1e-6));
    }

    let peakIdx = 0, peakVal = -1.0, totalPower = 0.0;
    for (let k = 0; k < numBins; k++) {
        const p = magLinear[k] * magLinear[k];
        totalPower += p;
        if (magLinear[k] > peakVal) {
            peakVal = magLinear[k];
            peakIdx = k;
        }
    }

    const halfLobe = (WINDOW_SPECS[windowType]?.mainLobeBins || 2) * zeroPadFactor;
    let mainPower = 0.0;
    for (let k = Math.max(0, peakIdx - halfLobe); k <= Math.min(numBins - 1, peakIdx + halfLobe); k++) {
        mainPower += magLinear[k] * magLinear[k];
    }

    const leakedPowerRatio = totalPower > 0 ? Math.max(0, (1.0 - mainPower / totalPower) * 100.0) : 0.0;

    return {
        w,
        y,
        nFFT,
        freqs,
        magLinear,
        magDb,
        leakedPowerRatio,
        spec: WINDOW_SPECS[windowType] || { name: windowType, psll: '--', mainLobeBins: 2 }
    };
}

/**
 * Quantifies academic DSP window lobe metrics (Main-lobe width, null width, PSL, detected peak).
 */
export function quantifyWindowMetrics(wType, N, fs, magDB, N_interp = 8192) {
    const w = generateWindow(wType, N);
    const real = new Float64Array(N_interp);
    const imag = new Float64Array(N_interp);
    real.set(w);

    fftRadix2(real, imag, false);

    const maxWinMag = Math.hypot(real[0], imag[0]);
    const halfInterp = N_interp >> 1;
    const winDB = new Float64Array(halfInterp);

    for (let k = 0; k < halfInterp; k++) {
        const m = Math.hypot(real[k], imag[k]);
        winDB[k] = 20.0 * Math.log10(Math.max(m / maxWinMag, 1e-12));
    }

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

    const mainLobeBins = WINDOW_SPECS[wType]?.mainLobeBins || 2;
    const binsPerInterp = N_interp / N;
    const searchStart = Math.max(1, Math.round(mainLobeBins * binsPerInterp * 0.70));
    const searchEnd = Math.min(halfInterp - 1, Math.round(mainLobeBins * binsPerInterp * 1.45));

    let kNull = Math.round(mainLobeBins * binsPerInterp);
    let minVal = 0.0;
    for (let k = searchStart; k <= searchEnd; k++) {
        if (winDB[k] < minVal) {
            minVal = winDB[k];
            kNull = k;
        }
    }
    const nullWidth_Hz = 2.0 * kNull * (fs / N_interp);
    const nullWidth_Bins = nullWidth_Hz / (fs / N);

    let maxSidelobe = -100.0;
    const sidelobeStart = kNull + 3;
    for (let k = sidelobeStart; k < halfInterp; k++) {
        if (winDB[k] > maxSidelobe) {
            maxSidelobe = winDB[k];
        }
    }

    let detectedFreqHz = 0.0;
    if (magDB && magDB.length > 0) {
        let peakIdx = 0;
        let maxVal = -Infinity;

        for (let k = 0; k < magDB.length; k++) {
            if (magDB[k] > maxVal) {
                maxVal = magDB[k];
                peakIdx = k;
            }
        }

        if (peakIdx > 0 && peakIdx < magDB.length - 1) {
            const alpha = magDB[peakIdx - 1];
            const beta = magDB[peakIdx];
            const gamma = magDB[peakIdx + 1];
            const denom = alpha - 2.0 * beta + gamma;
            const delta = Math.abs(denom) > 1e-9 ? 0.5 * (alpha - gamma) / denom : 0.0;
            detectedFreqHz = (peakIdx + delta) * (fs / (magDB.length * 2));
        } else {
            detectedFreqHz = peakIdx * (fs / (magDB.length * 2));
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
