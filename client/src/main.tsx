import { createRoot } from "react-dom/client";
import React from "react";
// import "./index.css"; // Temporarily commented out to isolate the issue
import App from "./App";

// Add error handling for initialization
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error stack:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  console.log('Starting app initialization...');
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log('Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('Rendering main app...');
  root.render(<App />);
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to initialize app:', error);
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: white; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h2>Failed to load application</h2>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="font-size: 12px; color: #888; margin-top: 10px;">${error instanceof Error ? error.stack : ''}</p>
        <button onclick="window.location.reload()" style="background: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
