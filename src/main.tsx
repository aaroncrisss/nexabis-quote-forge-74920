import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa-install-available"));
  });

  window.addEventListener("appinstalled", () => {
    window.__deferredPwaPrompt = null;
    window.dispatchEvent(new Event("pwa-installed"));
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
