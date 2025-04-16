import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Cadastro() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  function handleCadastro(e) {
    e.preventDefault();
    console.log("Usuário cadastrado:", usuario);
    alert("Cadastro realizado com sucesso!");
    navigate("/");
  }

  return (
    <div className="body">
      <form className="Login" onSubmit={handleCadastro}>
        <div className="logo-container">
          <p>Cadastro</p>
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

        <button className="button" type="submit">
          Cadastrar
        </button>
      </form>
    </div>
  );
}

export default Cadastro;
