import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerWikiAgentWebMCP } from "./webmcp";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found.");

ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);

const webMcpController = registerWikiAgentWebMCP();
if (import.meta.hot) import.meta.hot.dispose(() => webMcpController.abort());
