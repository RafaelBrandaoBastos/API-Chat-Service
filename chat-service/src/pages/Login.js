import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";

function Login() {
  const [erroLogin, setErroLogin] = useState("");

  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const { setUsername } = useContext(UserContext);
  const { username } = useContext(UserContext);

  useEffect(() => {
    setUsername("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://cf2d-2804-14c-5ba4-958e-ccf4-944b-5e3c-a36d.ngrok-free.app/users/login?username=${usuario}&password=${senha}`,
        {
          method: "POST",
        }
      );

      const resultText = await response.text(); // <- agora pega como texto puro
      // console.log("Resposta do servidor:", resultText); // Assumindo que a API retorna { success: true }

      if (!response.ok) {
        if (response.status === 406) {
          // Trata erro 406 "Not Acceptable"
          setErroLogin("Usuário ou senha incorreta");
          return;
        }
        setErroLogin("Erro inesperado ao tentar fazer login.");
        return;
      }

      setErroLogin(""); // limpa a mensagem de erro se der certo

      if (response.ok) {
        setUsername(usuario);
        navigate("/Home");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
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
            />
          </div>
        </div>

        <div className="button-group">
          <button className="button" type="submit">
            Entrar
          </button>
          <button
            className="button-cadastro"
            type="button"
            onClick={() => navigate("/Cadastro")}
          >
            Cadastro
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
