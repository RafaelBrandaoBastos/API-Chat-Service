import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./protectedRouter";
import { UserProvider } from "./contexts/UserContext";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "./contexts/UserContext";

function App() {
  const { loading } = useContext(UserContext);
  const { setUsername } = useContext(UserContext);
  const { username } = useContext(UserContext);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (localStorage.getItem("username") !== undefined) {
        verificarLogin();
      }

      localStorage.clear();
      localStorage.setItem("username", username);
      console.log("recarregou username como " + username);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [username]);

  if (loading) {
    return <div>Carregando...</div>; // ou um spinner bonito
  }

  const verificarLogin = async () => {
    try {
      const response = await fetch(
        "https://cf2d-2804-14c-5ba4-958e-ccf4-944b-5e3c-a36d.ngrok-free.app/users/login?username=Caio&password=123",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Substitua pelos dados esperados pela API
            username: "seu_usuario",
            password: "sua_senha",
          }),
        }
      );

      const resultText = await response.text(); // <- agora pega como texto puro
      console.log("Resposta do servidor:", resultText); // Assumindo que a API retorna { success: true }
      if (resultText === "Logado com sucesso.") {
        setUsername(localStorage.getItem("username"));
        console.log("bbbb");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Cadastro" element={<Cadastro />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/Home" element={<Home />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
