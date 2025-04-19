import "./Login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NestJSUsersEndpoint } from "../endpoints/Endpoint";

function Cadastro() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erroRegistro, setErroRegistro] = useState("");
  const [registrando, setRegistrando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrando(true);
    setErroRegistro("");

    try {
      const response = await fetch(`${NestJSUsersEndpoint}`, {
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

      if (!response.ok) {
        if (response.status === 409) {
          setErroRegistro("Nome de usuário já existe");
        } else {
          setErroRegistro(data.message || "Erro ao criar usuário");
        }
        setRegistrando(false);
        return;
      }

      // Registro bem-sucedido
      navigate("/");
    } catch (error) {
      console.error("Erro ao registrar:", error);
      setErroRegistro("Erro ao conectar no servidor");
      setRegistrando(false);
    }
  };

  return (
    <div className="body">
      <form className="Login" onSubmit={handleSubmit}>
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
              disabled={registrando}
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
              disabled={registrando}
            />
          </div>
          {erroRegistro && <p className="mensagem-erro">{erroRegistro}</p>}
        </div>

        <div className="button-group">
          <button className="button" type="submit" disabled={registrando}>
            Cadastrar
          </button>
          <button
            className="button-cadastro"
            type="button"
            onClick={() => navigate("/")}
            disabled={registrando}
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

export default Cadastro;
