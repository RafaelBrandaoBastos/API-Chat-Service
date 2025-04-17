import "./Sala.css";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { LocalUserEndpoint, LocalChatEndpoint } from "../endpoints/Endpoint";

function Sala() {
  const { username } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useRef(null);

  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    // Conectar WebSocket
    const wsUrl = `${LocalChatEndpoint.replace(
      "http",
      "ws"
    )}/chat/${id}/${username}`;
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      console.log("Conectado ao WebSocket");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "mensagem") {
        setMensagens((prev) => [
          ...prev,
          { nome: data.nome, texto: data.texto },
        ]);
      } else if (data.type === "sistema") {
        setMensagens((prev) => [
          ...prev,
          { nome: "⚠️ Sistema", texto: data.texto },
        ]);
        alert(data.texto);

        if (
          data.evento === "kick" ||
          data.evento === "removido" ||
          data.evento === "sala_excluida"
        ) {
          navigate("/home");
        }
      } else if (data.type === "usuarios") {
        setUsuarios(data.lista);
      }
    };

    socket.current.onerror = (error) => {
      console.error("Erro no WebSocket", error);
    };

    socket.current.onclose = () => {
      console.log("WebSocket fechado");
    };

    return () => {
      socket.current?.close();
    };
  }, [id, username, navigate]);

  function enviarMensagem() {
    if (mensagem.trim() !== "") {
      socket.current.send(
        JSON.stringify({ type: "mensagem", texto: mensagem })
      );
      setMensagem("");
    }
  }

  function verUsuarios() {
    socket.current.send(JSON.stringify({ type: "listar_usuarios" }));
  }

  function kickUsuario(nome) {
    if (nome === username) return alert("Você não pode se kickar!");
    socket.current.send(JSON.stringify({ type: "kick", alvo: nome }));
  }

  function sairSala() {
    socket.current.send(JSON.stringify({ type: "sair" }));
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

      {usuarios.length > 0 && (
        <div className="usuarios-popup">
          <h3>Usuários na sala:</h3>
          {usuarios.map((nome) => (
            <div
              key={nome}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>{nome}</span>
              <button onClick={() => kickUsuario(nome)}>Excluir</button>
            </div>
          ))}
        </div>
      )}

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
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
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
