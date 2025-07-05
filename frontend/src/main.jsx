import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  // Temporarily disable StrictMode to prevent socket disconnection issues
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
