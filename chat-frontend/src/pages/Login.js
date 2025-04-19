import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { NestJSAuthEndpoint } from "../endpoints/Endpoint";
import { testApiConnection, testAuthentication } from "../test-connection";

function Login() {
  const [erroLogin, setErroLogin] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const { setUsername, setToken } = useContext(UserContext);

  // Testar conexão com a API quando o componente carregar
  useEffect(() => {
    async function checkApiConnection() {
      setConnecting(true);
      const result = await testApiConnection();
      setApiConnected(result);
      setConnecting(false);

      if (!result) {
        setMensagemErro(
          "Não foi possível conectar à API. Verifique se o backend está rodando."
        );
      }
    }

    checkApiConnection();
    setUsername("");
  }, [setUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLogin("");
    setMensagemErro("");

    if (!apiConnected) {
      setMensagemErro(
        "Sistema indisponível. Verifique sua conexão com a internet."
      );
      return;
    }

    try {
      // Tenta autenticar diretamente
      const response = await fetch(`${NestJSAuthEndpoint}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: usuario,
          password: senha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login bem-sucedido:", data);
        setErroLogin("");
        setUsername(usuario);
        setToken(data.access_token);
        navigate("/Home");
      } else {
        console.error("Erro no login:", response.status, data);
        if (response.status === 401) {
          setErroLogin("Usuário ou senha incorreta");
        } else {
          setErroLogin(
            data.message || "Erro inesperado ao tentar fazer login."
          );
        }
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setMensagemErro("Erro ao conectar no servidor de autenticação.");
    }
  };

  return (
    <div className="body">
      <form className="Login" onSubmit={handleSubmit}>
        <div className="logo-container">
          <p>Login</p>
          <img src="/chat.png" alt="logo" width={165} height={165}></img>
        </div>

        <div className="inputs">
          <div className="form-group">
            <label htmlFor="usuario">User</label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder=" User"
              required
              disabled={connecting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder=" Password"
              required
              disabled={connecting}
            />
          </div>
          {erroLogin && <p className="mensagem-erro">{erroLogin}</p>}
          {mensagemErro && <p className="mensagem-erro">{mensagemErro}</p>}
          {connecting && (
            <p className="info-message">Conectando ao servidor...</p>
          )}
          {!connecting && apiConnected && (
            <p className="success-message">Servidor conectado!</p>
          )}
        </div>

        <div className="button-group">
          <button
            className="button"
            type="submit"
            disabled={connecting || !apiConnected}
          >
            Entrar
          </button>
          <button
            className="button-cadastro"
            type="button"
            onClick={() => navigate("/Cadastro")}
            disabled={connecting || !apiConnected}
          >
            Cadastro
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
