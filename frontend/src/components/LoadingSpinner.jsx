// src/components/LoadingSpinner.jsx
import React from 'react';

export const LoadingSpinner = () => (
  <div className="spinner" style={{ textAlign: 'center', padding: '2rem' }}>
    <div className="lds-ring" style={{ display: 'inline-block', width: '80px', height: '80px' }}>
      <div style={{ boxSizing: 'border-box', display: 'block', width: '64px', height: '64px', margin: '8px', border: '8px solid #ccc', borderRadius: '50%', animation: 'lds-ring 1.2s linear infinite', borderColor: '#ccc transparent transparent transparent' }}></div>
      <style>{`
        @keyframes lds-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);
