import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { warmUpBackend } from "./lib/api.ts";
import "./index.css";

/*
 * Start the backend waking before React mounts. On a cold host this buys back
 * most of the start-up delay, because signing in takes time the user spends
 * anyway. Deliberately not awaited — nothing here blocks the first paint.
 */
warmUpBackend();

createRoot(document.getElementById("root")!).render(<App />);
