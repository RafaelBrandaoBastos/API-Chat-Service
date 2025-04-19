import { createContext, useState, useEffect } from "react";
import { NestJSUsersEndpoint } from "../endpoints/Endpoint";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const verificarToken = async () => {
    try {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      // Validar o token obtendo informações do usuário
      const response = await fetch(`${NestJSUsersEndpoint}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Token inválido ou expirado:", response.status);
        // Token inválido, remover do localStorage
        localStorage.removeItem("token");
        setToken(null);
        setUsername(null);
        setLoading(false);
        return;
      }

      const userData = await response.json();
      console.log("Perfil do usuário carregado:", userData);
      setUsername(userData.login);
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUsername(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUsername(null);
  };

  useEffect(() => {
    verificarToken();
  }, []);

  // Efeito para salvar token quando ele mudar
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);

  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        loading,
        token,
        setToken,
        logout,
        isAuthenticated: !!token,
        verificarToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
