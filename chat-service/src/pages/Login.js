import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";

function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const { setUsername } = useContext(UserContext);
  const { username } = useContext(UserContext);

  useEffect(() => {
    setUsername("");
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setUsername(usuario);
    navigate("/Home");
  }

  return (
    <div className="body">
      <form className="Login" onSubmit={handleSubmit}>
        <div className="logo"></div>

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

        <button className="button" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;
