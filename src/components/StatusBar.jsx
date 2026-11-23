import React from 'react';

export default function StatusBar({ isMicActive, binSpacing }) {
    return (
        <footer className="statusbar">
            <span>STATUS: {isMicActive ? 'LIVE MICROPHONE STREAMING' : 'SYNTHETIC / FILE ENGINE READY'}</span>
            <span>DFT BIN RESOLUTION (fs/N): {binSpacing} Hz | ZERO-PADDED FFT: 8192 BINS</span>
            <span>IITM BS ELECTRONIC SYSTEMS — SP09 WORKBENCH</span>
        </footer>
    );
}
