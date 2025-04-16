import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { IpFowardingTunnel } from "../contexts/endpoint";

function Login() {
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
        "https://7bc9-2804-14c-5ba4-958e-b00e-4f09-6704-9ab9.ngrok-free.app/users/login?username=Caio&password=123",
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
      setUsername(usuario);
      navigate("/Home");
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
