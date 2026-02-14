import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Debug network connectivity
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

// Test external fetch
fetch("https://www.google.com/generate_204", { mode: 'no-cors' })
  .then(() => console.log("DEBUG: External connectivity test (google) successful"))
  .catch(e => console.warn("DEBUG: External connectivity test (google) failed:", e));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
