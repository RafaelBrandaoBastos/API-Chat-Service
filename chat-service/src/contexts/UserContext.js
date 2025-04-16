import { createContext, useState, useEffect } from "react";
import IpFowardingTunnel from "../endpoints/Endpoint";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const verificarLogin = async (nome) => {
    try {
      const response = await fetch(
        `${IpFowardingTunnel}/users/exists/${nome}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        alert("Erro inesperado no servidor. Por favor, tente novamente.");
        return;
      }

      const contentType = response.headers.get("Content-Type");

      if (contentType && contentType.includes("application/json")) {
        const resultJson = await response.json();
        // console.log("Resposta da API:", resultJson);

        if (resultJson === true) {
          setUsername(nome);
        } else {
          console.warn("Usuário inválido:", nome);
        }
      } else {
        const resultText = await response.text();
        console.error(
          "⚠️ A resposta não é JSON. Conteúdo recebido como texto/HTML:"
        );
        console.log(resultText); // Aqui imprime o HTML recebido
        alert("Erro inesperado no servidor. Por favor, tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao verificar login:", err);
      alert(
        "Ocorreu um erro ao verificar o login. Verifique a conexão com o servidor."
      );
    } finally {
      localStorage.removeItem("username");
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      verificarLogin(storedUser);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, loading }}>
      {children}
    </UserContext.Provider>
  );
};
