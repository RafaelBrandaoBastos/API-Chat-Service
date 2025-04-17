import "./Sala.css";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";

function Sala() {
  const [usuarios, setUsuarios] = useState([]);
  const { username } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);

  function enviarMensagem() {
    if (mensagem.trim() !== "") {
      const nova = { nome: username, texto: mensagem };
      setMensagens([...mensagens, nova]);
      setMensagem("");
    }
  }

  function SendIcon() {
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
      </svg>
    );
  }

  function verUsuarios() {
    alert("Usuários da sala: Caio, Yrlan...");
  }

  function sairSala() {
    navigate("/home");
  }

  return (
    <div className="container-sala">
      <header className="menu">
        <div className="custom-header-padding">
          <div className="logo-text">
            <img src="/chat.png" alt="logo" width={79} height={79} />
            <p className="title-sala">Sala {id}</p>
          </div>
          <div className="sala-buttons-container">
            <button className="sala-buttons" onClick={verUsuarios}>
              Ver Usuários
            </button>
            <button className="sala-buttons" onClick={sairSala}>
              Sair da Sala
            </button>
          </div>
        </div>
      </header>

      <div className="mensagens">
        {mensagens.map((msg, index) => (
          <div key={index} className="mensagem">
            <div className="avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="4" />
                <path d="M4,22 C4,17 20,17 20,22" />
              </svg>
            </div>
            <div className="bolha">
              <span>
                <strong>{msg.nome}:</strong> {msg.texto}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className="mensagem-footer">
        <div className="footer-custom-width">
          <button className="botao-enviar" onClick={enviarMensagem}>
            <svg
              width="70"
              height="70"
              viewBox="0 0 70 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M70 35C70 54.33 54.33 70 35 70C15.67 70 0 54.33 0 35C0 15.67 15.67 0 35 0C54.33 0 70 15.67 70 35Z"
                fill="#8C309B"
              />
              <path
                d="M47.7985 20.6343L29.1231 39.3097M47.7985 20.6343L35.9142 54.5896L29.1231 39.3097M47.7985 20.6343L13.8433 32.5187L29.1231 39.3097"
                stroke="white"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>
      </footer>
    </div>
  );
}

export default Sala;
