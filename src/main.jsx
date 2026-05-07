import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* AuthProvider enveloppe toute l'app */}
    {/* Comme ça toutes les pages savent qui est connecté */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);