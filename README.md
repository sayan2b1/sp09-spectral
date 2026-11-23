# SP09: Windowing Effects on Spectral Leakage Analyzer

An interactive academic Digital Signal Processing (DSP) web workbench designed for analyzing finite-length signal windowing and spectral leakage phenomena.

Built for the **IIT Madras BS in Electronic Systems** curriculum and general DSP lab / Viva preparation.

---

## 🔬 Theoretical Background

### 1. Finite-Length Windowing & The Convolution Theorem
In practical DSP systems, acquiring a discrete-time signal $x[n]$ over a finite observation window of $N$ samples is mathematically equivalent to multiplying the infinite-duration signal by a window function $w[n]$:

$$x_w[n] = x[n] \cdot w[n], \quad 0 \le n \le N - 1$$

By the discrete-time Fourier transform (DTFT) modulation/convolution theorem:

$$X_w(e^{j\omega}) = \frac{1}{2\pi} X(e^{j\omega}) \circledast W(e^{j\omega})$$

When sampling a sinusoid:
- **Coherent Sampling:** If the sinusoid contains an exact integer number of cycles within the window length $N$ ($f_1 = k \cdot f_s / N$), energy falls directly on DFT bin centers, and adjacent DFT samples coincide with the zeros of the Dirichlet kernel $W(e^{j\omega})$.
- **Non-Coherent Sampling:** If the frequency does not lie on an integer bin center ($f_1 \ne k \cdot f_s / N$), energy spills into neighboring bins. This is **Spectral Leakage**.

---

### 2. The Window Tradeoff
Different window functions negotiate the fundamental trade-off between **Main-Lobe Width** (frequency resolution) and **Peak Side-Lobe Level** (dynamic range and leakage suppression):

| Window | -3 dB Width (Bins) | Null-to-Null Width (Bins) | Peak Side-Lobe Level (PSL) | Side-Lobe Roll-Off Rate |
| :--- | :---: | :---: | :---: | :---: |
| **Rectangular** | $0.89$ | $2.00$ | $-13.3\text{ dB}$ | $-6\text{ dB/octave}$ |
| **Bartlett** | $1.28$ | $4.00$ | $-26.5\text{ dB}$ | $-12\text{ dB/octave}$ |
| **Hann** | $1.44$ | $4.00$ | $-31.5\text{ dB}$ | $-18\text{ dB/octave}$ |
| **Hamming** | $1.30$ | $4.00$ | $-42.7\text{ dB}$ | $-6\text{ dB/octave}$ |
| **Blackman** | $1.68$ | $6.00$ | $-58.1\text{ dB}$ | $-18\text{ dB/octave}$ |

---

## 🚀 Features

- **Window Function Comparison:** Real-time spectral overlay for Rectangular, Hann, Hamming, Blackman, and Bartlett windows.
- **Pure JavaScript Cooley-Tukey Radix-2 FFT:** High-performance, zero-padded in-place FFT implementation with zero external DSP library dependencies.
- **Live Metrics Quantification:**
  - $-3\text{ dB}$ Main-Lobe Width (Hz & DFT bins via linear interpolation).
  - Null-to-Null Main-Lobe Width (Hz & DFT bins).
  - Peak Side-Lobe Level (PSL in dB relative to $0\text{ dB}$ normalized peak).
  - Detected Fundamental Peak (Hz via 3-point parabolic interpolation).
- **Interactive Signal Generator:** Supports Single Sinusoid, Dual-Tone (masking experiments), Square Waves, and Linear FM Chirps.
- **Custom Input Support:** Direct drag-and-drop file upload (`.csv`, `.txt`, `.wav`) and live Web Audio microphone streaming.
- **Report Export:** Instant CSV export of quantified window metrics for lab reports.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```
sp09-spectral/
├── public/
│   ├── manifest.json       # Web App Manifest
│   └── vite.svg            # Minimalist DSP Waveform SVG Icon
├── src/
│   ├── App.jsx             # Interactive UI & Workbench Dashboard
│   ├── dspEngine.js        # Pure JS Cooley-Tukey FFT & Window Metrics Engine
│   ├── index.css           # Instrument Rack & Dark Theme Styles
│   └── main.jsx            # Application Entrypoint
├── index.html              # HTML Shell
├── package.json            # Project Dependencies
├── sample_signal.csv       # 128-sample 2-tone test signal
└── vite.config.js          # Vite Configuration
```
