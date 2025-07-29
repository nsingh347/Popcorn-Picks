import React from 'react';

// Minimal test component
function MinimalApp() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#000', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Popcorn Picks</h1>
        <p>Minimal App Test</p>
        <p style={{ fontSize: '14px', color: '#888' }}>Testing component initialization...</p>
      </div>
    </div>
  );
}

export default function App() {
  return <MinimalApp />;
}
