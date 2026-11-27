// src/components/StatusBar.jsx
import React from 'react';

export default function StatusBar({ isMicActive, binSpacing }) {
    return (
        <footer className="statusbar">
            <span>STATUS: {isMicActive ? '● LIVE AUDIO STREAMING' : 'READY (SYNTHETIC / FILE)'}</span>
            <span>DFT BIN RESOLUTION (fs/N): {binSpacing} Hz</span>
            <span>ZERO-PADDED FFT: 8192 BINS</span>
            <span>IITM BS ELECTRONIC SYSTEMS — SP09</span>
        </footer>
    );
}
