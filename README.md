# SP09 // Windowing Effects & Spectral Leakage Bench

> **Interactive Academic Digital Signal Processing (DSP) Workbench**  
> Designed for analyzing finite-length signal windowing, Dirichlet kernel convolution, and spectral leakage phenomena.  
> Developed for the **IIT Madras BS in Electronic Systems** curriculum (SP09 Project Specification).

[![Live Demo - GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2563eb?style=for-the-badge&logo=github)](https://sayan2b1.github.io/sp09-spectral/)
[![Mirror - Vercel](https://img.shields.io/badge/Mirror-Vercel-black?style=for-the-badge&logo=vercel)](https://sp09-spectral.vercel.app)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20iOS%20(PWA)-10b981?style=for-the-badge)](https://sayan2b1.github.io/sp09-spectral/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🌐 Live Deployments

- 🚀 **GitHub Pages Deployment**: [https://sayan2b1.github.io/sp09-spectral/](https://sayan2b1.github.io/sp09-spectral/)
- ⚡ **Vercel Production Mirror**: [https://sp09-spectral.vercel.app](https://sp09-spectral.vercel.app)

---

## 📋 Course Specification Checklist (SP09)

| Requirement Clause | Implementation Details | Status |
| :--- | :--- | :---: |
| **Web / Android / iOS app** | Progressive Web App (PWA) with responsive mobile desktop-mode drawer, touch-optimized sliders, and home-screen installability on Android & iOS. | ✅ **100%** |
| **Windowing effects on spectral leakage** | Live time-domain window multiplication $x_w[n] = x[n] \cdot w[n]$ and frequency-domain DTFT/FFT spectral convolution visualization. | ✅ **100%** |
| **Compare Rectangular, Hamming, Hann & other windows** | Side-by-side comparative analysis of **Rectangular**, **Hann**, **Hamming**, **Blackman**, **Bartlett**, and **Flat-Top** (5-term ISO standard). | ✅ **100%** |
| **Same finite-length sinusoid & any input signal** | Single sinusoid ($\sin(2\pi f_0 t)$), two-tone masking ($0\text{ dB} + -32\text{ dB}$), square wave, multi-carrier, linear chirp, custom `.wav`/`.csv` file upload, and real-time live microphone stream. | ✅ **100%** |
| **Plot magnitude spectra** | Dual-Trace Plotter (Trace A: Time-Domain Envelope; Trace B: Frequency-Domain Spectrum) with Logarithmic ($-110\text{ dB}$ to $+6\text{ dB}$) and Linear ($0.0$ to $1.1$) scaling. | ✅ **100%** |
| **Quantify main-lobe width & side-lobe levels** | Automated real-time extraction of $-3\text{ dB}$ Main-Lobe Width, Null-to-Null Width, Peak Side-Lobe Level (PSLL), Leaked Power Ratio (%), and Detected Peak via parabolic interpolation. | ✅ **100%** |

---

## 🔬 Theoretical DSP Background

### 1. Finite-Length Windowing & The Convolution Theorem
In digital signal processing, acquiring a signal $x[n]$ over a finite observation window of duration $T = N \cdot T_s$ is mathematically represented as multiplying the theoretical infinite-duration signal by a window sequence $w[n]$:

$$x_w[n] = x[n] \cdot w[n], \quad 0 \le n \le N - 1$$

Applying the Discrete-Time Fourier Transform (DTFT) modulation theorem, multiplication in time corresponds to circular/continuous convolution in the frequency domain:

$$X_w(e^{j\omega}) = \frac{1}{2\pi} X(e^{j\omega}) \circledast W(e^{j\omega})$$

For an ideal pure complex sinusoid $x[n] = e^{j\omega_0 n}$, the resulting DTFT spectrum is the shifted window transform:

$$X_w(e^{j\omega}) = W(e^{j(\omega - \omega_0)})$$

---

### 2. Coherent Lock vs. Non-Coherent Spectral Leakage

When evaluating the spectrum using an $N$-point Discrete Fourier Transform (DFT):

$$\omega_k = \frac{2\pi k}{N}, \quad k \in \{0, 1, \dots, N-1\}$$

- **Coherent Sampling ($k = f_0 \cdot T \in \mathbb{Z}$):**  
  The signal contains an exact integer number of complete cycles within the observation interval. The frequency lies exactly on a DFT bin center ($f_0 = k \cdot \Delta f$). Because all other DFT bin frequencies land on the exact periodic nulls of the window's Dirichlet kernel, **spectral leakage is zero** ($0.00\%$).
  
- **Non-Coherent Sampling ($k = f_0 \cdot T \notin \mathbb{Z}$):**  
  The signal contains a fractional number of cycles (e.g., $k = 10.5$). The periodic boundary condition assumed by the DFT creates an abrupt phase discontinuity at the window edges. Energy spills from the true peak into all adjacent bins. This constitutes **Spectral Leakage**.

---

### 3. Coherent Gain Normalization
To facilitate honest comparison of side-lobe suppression and dynamic range, all windowed spectra are normalized by their **coherent gain** (DC sum):

$$S_1 = \sum_{n=0}^{N-1} w[n]$$

$$X_{\text{norm}}[k] = \frac{X[k]}{S_1} \implies \left|X_{\text{norm}}[k]\right|_{\text{peak}} \le 1.0 \quad (0.0\text{ dB})$$

---

### 4. Zero-Padding as DTFT Interpolation
Zero-padding an $N$-sample sequence to length $M > N$ ($M = \alpha \cdot N$, where $\alpha \in \{1\times, 2\times, 4\times, 8\times, 16\times\}$):
1. **Does NOT increase the fundamental physics-based resolution** (which is strictly bounded by $1/T$).
2. **Densely samples the continuous DTFT spectrum**, eliminating scalloping loss and revealing the exact sidelobe structure and nulls of $W(e^{j\omega})$.

---

### 5. Bluestein's Chirp-Z Transform (Exact Arbitrary-$N$ FFT)
Standard Radix-2 Cooley-Tukey FFTs restrict $N$ to powers of 2 ($64, 128, 256, 512, \dots$). For real-world instrumentation where capture duration $T$ creates arbitrary integer sample counts ($N = 150, 200, 210, 315$), **SP09 implements Bluestein's Algorithm**.

By utilizing the algebraic identity:

$$2nk = n^2 + k^2 - (k - n)^2$$

The arbitrary-$N$ DFT is reformulated as a discrete fast convolution:

$$X[k] = e^{-j\frac{\pi k^2}{N}} \sum_{n=0}^{N-1} \left( x[n] e^{-j\frac{\pi n^2}{N}} \right) e^{j\frac{\pi (k-n)^2}{N}}$$

This convolution of length $L \ge 2N - 1$ is computed via power-of-2 Radix-2 FFTs in $\mathcal{O}(N \log N)$ time, yielding **exact DFT bin alignment** for any sample count.

---

## 📊 Window Comparison Benchmark Table

| Window Function | Mathematical Formulation $w[n], \quad 0 \le n \le N-1$ | -3 dB Main Lobe | Null-to-Null Width | Peak Side-Lobe Level (PSLL) | Sidelobe Roll-off | Best Engineering Use Case |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Rectangular (Uniform)** | $w[n] = 1$ | $0.89\text{ bins}$ | $2.00\text{ bins}$ | **$-13.3\text{ dB}$** | $-6\text{ dB/oct}$ | Highest frequency resolution; strict coherent testing. |
| **Bartlett (Triangular)** | $w[n] = 1 - \left|\frac{2n - (N-1)}{N-1}\right|$ | $1.28\text{ bins}$ | $4.00\text{ bins}$ | **$-26.5\text{ dB}$** | $-12\text{ dB/oct}$ | Moderate resolution; positive semidefinite spectrum. |
| **Hann (Hanning)** | $w[n] = 0.5 - 0.5\cos\left(\frac{2\pi n}{N-1}\right)$ | $1.44\text{ bins}$ | $4.00\text{ bins}$ | **$-31.5\text{ dB}$** | **$-18\text{ dB/oct}$** | Excellent general-purpose audio & noise analysis. |
| **Hamming** | $w[n] = 0.54 - 0.46\cos\left(\frac{2\pi n}{N-1}\right)$ | $1.30\text{ bins}$ | $4.00\text{ bins}$ | **$-42.7\text{ dB}$** | $-6\text{ dB/oct}$ | Optimal 1st side-lobe cancellation; speech analysis. |
| **Blackman (3-term)** | $w[n] = 0.42 - 0.5\cos\left(\frac{2\pi n}{N-1}\right) + 0.08\cos\left(\frac{4\pi n}{N-1}\right)$ | $1.68\text{ bins}$ | $6.00\text{ bins}$ | **$-58.1\text{ dB}$** | **$-18\text{ dB/oct}$** | High dynamic range; detecting weak tones near carriers. |
| **Flat-Top (ISO Standard)** | $w[n] = a_0 - a_1\cos(\theta) + a_2\cos(2\theta) - a_3\cos(3\theta) + a_4\cos(4\theta)$ | $3.77\text{ bins}$ | $10.00\text{ bins}$ | **$-93.0\text{ dB}$** | $0\text{ dB}$ error | Precision calibration; absolute amplitude accuracy. |

---

## ⚡ Key Application Features

### 1. Dual-Trace Split Workbench
- **Trace A // Time Domain**: Displays the raw input signal $x[n]$, the window envelope $w[n]$ (dashed contour), and the resulting windowed sequence $x_w[n]$.
- **Trace B // Frequency Domain**: Displays the coherent-gain-normalized magnitude spectrum with interactive crosshair tooltips.

### 2. Live Telemetry Readout Strip
Real-time header cells updating synchronously at 60 FPS:
- **`SAMPLES / FFT`**: Observation length $N$ vs. Zero-padded FFT length $M$ (e.g., $210 / 210$ or $150 / 1200$).
- **`CYCLES (k = f0·T)`**: Exact number of cycles captured in the window frame.
- **`BIN ALIGNMENT`**: Live status badge:
  - 🟢 **`COHERENT LOCK`** (integer cycles, zero leakage)
  - 🔴 **`NON-COHERENT`** (fractional cycles, leakage active)
- **`CH1 PSLL`**: Theoretical peak side-lobe suppression of the primary channel (e.g. $-31.5\text{ dB}$).
- **`LEAKED POWER`**: Integrated fractional energy residing outside the main lobe:
  $$\text{Leaked Power (\%)} = \left( 1 - \frac{\sum_{\text{main-lobe}} |X[k]|^2}{\sum_{\text{total}} |X[k]|^2} \right) \times 100\%$$

### 3. Benchmark Quantification Table
Includes automated sub-bin peak estimation via 3-point parabolic interpolation:

$$\delta = \frac{1}{2} \cdot \frac{|X_{k-1}| - |X_{k+1}|}{|X_{k-1}| - 2|X_k| + |X_{k+1}|}, \quad f_{\text{peak}} = (k + \delta) \cdot \frac{f_s}{M}$$

### 4. One-Click Reference Setups
Integrated preset bar with persistent active state and pulsing visual indicator:
1. **Coherent Lock**: $f_0 = 50\text{ Hz}, T = 0.20\text{ s}, N = 200, k = 10.000$ (clean impulse, 0% leakage).
2. **Half-Bin Leakage**: $f_0 = 50\text{ Hz}, T = 0.21\text{ s}, N = 210, k = 10.500$ (worst-case Rectangular leakage).
3. **Two-Tone Masking**: $f_0 = 50\text{ Hz}$ ($0\text{ dB}$) tone + $68\text{ Hz}$ ($-32\text{ dB}$) weak tone (demonstrates how Rectangular side-lobes mask weak signals while Blackman resolves them).
4. **8x Zero-Pad**: $f_0 = 50\text{ Hz}, T = 0.15\text{ s}, N = 150, 8\times$ zero-padding (smooth DTFT interpolation).

### 5. Mobile Desktop-Mode & Theme Support
- **Off-Canvas Slide Drawer**: Keeps control knobs accessible via a slide-out drawer on mobile screens and desktop-mode browsers.
- **Fixed Aspect Ratio**: Prevents vertical graph distortion on narrow portrait displays.
- **Dual Themes**: Instant toggle between Dark Engineering Console and High-Contrast Light Mode.
- **PWA Ready**: Installable as a standalone app on Android and iOS devices.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core**: React 18, Vite
- **DSP Engine**: Pure JavaScript (`dspEngine.js`) — Cooley-Tukey Radix-2 FFT, Bluestein Arbitrary-$N$ Chirp-Z FFT, 6 Analytical Window Generators, Parabolic Sub-Bin Peak Interpolator, Numerical Integration. Zero external heavy math runtimes.
- **Visuals & Charts**: High-speed HTML5 Canvas rendering with crisp retina DPI scaling.
- **Icons & Styling**: Lucide Icons, Modern CSS Design Tokens with CSS Custom Properties.

```text
sp09-spectral/
├── .github/workflows/
│   └── deploy.yml            # Automated GitHub Actions deployment to GitHub Pages
├── public/
│   ├── manifest.json         # PWA Manifest (Android & iOS installability)
│   └── vite.svg              # DSP Waveform Logo
├── src/
│   ├── components/
│   │   ├── InstrumentRack.jsx    # Signal & Window Parameter Control Rail
│   │   ├── MetricsTable.jsx      # Quantified Lobe & Leakage Reference Table
│   │   ├── SpectrumChart.jsx     # High-Resolution Frequency Domain Canvas Plotter
│   │   ├── StatusBar.jsx         # Bottom Diagnostic & Resolution Readout
│   │   ├── TelemetryBar.jsx      # Top 5-Cell Real-Time Telemetry Strip
│   │   ├── TimeDomainChart.jsx   # Time-Domain Signal & Window Envelope Canvas
│   │   └── TopBar.jsx            # Header, Presets, Audio Toggle, Theme Switcher
│   ├── App.jsx               # State Machine, Responsive Drawer & View Routing
│   ├── dspEngine.js          # Pure JS Bluestein FFT & Windowing Mathematics
│   ├── index.css             # High-Contrast Dark & Light Mode Design Tokens
│   └── main.jsx              # React Entrypoint
├── index.html                # HTML5 PWA Shell
├── package.json              # Project Configuration
├── sample_signal.csv         # 128-sample 2-tone test dataset
└── vite.config.js            # Vite Bundler Configuration (Relative Base Support)
```

---

## 🚀 Local Development

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or pnpm

### Getting Started
```bash
# 1. Clone the repository
git clone https://github.com/sayan2b1/sp09-spectral.git
cd sp09-spectral

# 2. Install dependencies
npm install

# 3. Launch Vite local dev server
npm run dev

# 4. Build production bundle
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 📄 License & Attribution

Developed by **Sayan** ([@sayan2b1](https://github.com/sayan2b1)) as an individual project for the **IIT Madras BS in Electronic Systems** (DSP Lab / Windowing Effects & Spectral Leakage Analyzer).

Licensed under the [MIT License](LICENSE).
