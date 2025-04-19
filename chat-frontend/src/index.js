import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { UserProvider } from "./contexts/UserContext";
import { ChatProvider } from "./contexts/ChatContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <UserProvider>
    <ChatProvider>
      <App />
    </ChatProvider>
  </UserProvider>
  // </React.StrictMode>
);

// Desabilitar explicitamente o Hot Module Replacement para evitar requisições infinitas
if (module.hot) {
  module.hot.decline();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
