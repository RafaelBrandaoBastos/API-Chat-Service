import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./protectedRouter";
import { UserProvider } from "./contexts/UserContext";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "./contexts/UserContext";
import Sala from "./pages/Sala";
import { ChatProvider } from "./contexts/ChatContext";

function App() {
  const { setUsername } = useContext(UserContext);
  const { username } = useContext(UserContext);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (username) {
        localStorage.setItem("username", username);
        console.log("SETOU" + username + "local storage");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [username]);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Cadastro" element={<Cadastro />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/Home" element={<Home />} />
            <Route path="/chats/:id" element={<Sala />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
