/**
 * アプリケーションエントリーポイント
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

console.log("App starting...");
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
  throw new Error("ルート要素が見つかりません");
}

console.log("Rendering app...");
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
