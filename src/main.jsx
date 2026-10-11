import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DfaProvider } from "./layouts/DfaContext.jsx";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DfaProvider>
        <App />
      </DfaProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
