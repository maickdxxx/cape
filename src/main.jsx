import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CapeSeoEnhancer from "./cape-seo.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <CapeSeoEnhancer />
  </React.StrictMode>,
);
