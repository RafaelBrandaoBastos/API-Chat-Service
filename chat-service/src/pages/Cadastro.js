import "./Login.css";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

function Cadastro() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();
  const [mensagemErro, setMensagemErro] = useState("");
  const { setUsername } = useContext(UserContext);

  const handleCadastro = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `https://7bc9-2804-14c-5ba4-958e-b00e-4f09-6704-9ab9.ngrok-free.app/users/register?username=${usuario}&password=${senha}`,
        {
          method: "POST",
        }
      );

      const resultado = await response.text();
      console.log("Resposta do servidor:", resultado);

      if (!response.ok) {
        setMensagemErro("Erro ao cadastrar. Tente outro usuário.");
        return;
      }

      setMensagemErro("");
      navigate("/"); // volta para o login
    } catch (error) {
      console.log("Erro ao cadastrar:", error);
      setMensagemErro("Erro ao conectar no servidor.");
    }
  };

  
  return (
    <div className="body">
      <form className="Login" onSubmit={handleCadastro}>
        <div className="logo-container">
          <p>Cadastro</p>
          <img src="/chat.png" alt="logo" width={165} height={165} />
        </div>

        <div className="inputs">
          <div className="form-group">
            <label htmlFor="usuario">User</label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="User"
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
              placeholder="Password"
              required
            />
          </div>
        </div>

        {mensagemErro && <p className="mensagem-erro">{mensagemErro}</p>}

        <button className="button" type="submit">
          Cadastrar
        </button>
      </form>
    </div>
  );
}

export default Cadastro;
