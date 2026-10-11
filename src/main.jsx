import React from "react";
import ReactDOM from "react-dom/client";
import { DfaProvider } from "./layouts/DfaContext.jsx";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DfaProvider>
      <App />
    </DfaProvider>
  </React.StrictMode>,
);
