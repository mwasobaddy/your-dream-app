import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./components/compass/compass.css";
import { registerSW } from "./pwa";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker only outside Sight Lab preview / iframes (see ./pwa.ts)
registerSW();
