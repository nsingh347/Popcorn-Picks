import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling for initialization
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error('Failed to initialize app:', error);
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: white; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h2>Failed to load application</h2>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="background: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
