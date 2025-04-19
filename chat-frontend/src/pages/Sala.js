import "./Sala.css";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import {
  NestJSApiEndpoint,
  NestJSRoomsEndpoint,
  NestJSMessagesEndpoint,
  NestJSWsEndpoint,
} from "../endpoints/Endpoint";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function Sala() {
  const { username, token } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const stompClient = useRef(null);
  const [connected, setConnected] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [nomeSala, setNomeSala] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Buscar informações da sala
  useEffect(() => {
    console.log("Buscando informações da sala:", id);
    fetch(`${NestJSRoomsEndpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        console.log("Dados da sala:", data);
        setNomeSala(data.name);
      })
      .catch((err) => {
        console.error("Erro ao buscar informações da sala:", err);
        setErrorMsg("Erro ao carregar informações da sala");
      });

    // Buscar mensagens anteriores - URL corrigida aqui
    console.log(
      `Buscando mensagens da sala: ${NestJSRoomsEndpoint}/${id}/messages`
    );
    fetch(`${NestJSRoomsEndpoint}/${id}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          console.error(`Erro ${res.status}: ${res.statusText}`);
          throw new Error(`Erro ao carregar mensagens: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Mensagens recebidas:", data);
        setMensagens(
          data.map((msg) => ({
            nome: msg.sender.login,
            texto: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
        );
      })
      .catch((err) => {
        console.error("Erro ao buscar mensagens:", err);
        setErrorMsg("Erro ao carregar mensagens");
      });
  }, [id, token]);

  // Configurar conexão WebSocket
  useEffect(() => {
    if (!token) return;

    const socket = new SockJS(NestJSWsEndpoint);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("✅ Conectado ao WebSocket na sala");
        stompClient.current = client;
        setConnected(true);

        // Inscrever para receber mensagens da sala
        client.subscribe(`/topic/room.${id}`, (message) => {
          const msgData = JSON.parse(message.body);
          setMensagens((prev) => [
            ...prev,
            {
              nome: msgData.sender.login,
              texto: msgData.content,
              timestamp: new Date(msgData.createdAt || Date.now()),
            },
          ]);
        });

        // Inscrever para eventos do sistema
        client.subscribe(`/topic/room.${id}.system`, (message) => {
          const systemData = JSON.parse(message.body);
          setMensagens((prev) => [
            ...prev,
            {
              nome: "⚠️ Sistema",
              texto: systemData.content || systemData.message,
              timestamp: new Date(),
            },
          ]);

          // Tratar eventos de sistema
          if (
            systemData.type === "USER_LEFT" ||
            systemData.type === "USER_KICKED" ||
            systemData.type === "ROOM_DELETED"
          ) {
            if (
              systemData.targetUser === username ||
              systemData.type === "ROOM_DELETED"
            ) {
              navigate("/Home");
            }
          } else if (systemData.type === "USERS_LIST") {
            setUsuarios(systemData.users || []);
          }
        });

        // Informar servidor que entrou na sala
        client.publish({
          destination: `/app/room.${id}.join`,
          body: JSON.stringify({}),
        });
      },
      onWebSocketError: (error) => {
        console.error("❌ WebSocket Error:", error);
        setErrorMsg("Erro na conexão WebSocket");
      },
    });

    client.activate();

    return () => {
      if (client.connected) {
        // Informar servidor que saiu da sala
        client.publish({
          destination: `/app/room.${id}.leave`,
          body: JSON.stringify({}),
        });
      }
      client.deactivate();
      console.log("🔌 WebSocket desconectado");
    };
  }, [id, token, username, navigate]);

  function enviarMensagem() {
    if (!connected || !mensagem.trim()) return;

    console.log("Enviando mensagem para sala:", id);
    // Tentativa direta via API
    fetch(`${NestJSRoomsEndpoint}/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: mensagem,
        senderId: "", // será preenchido pelo backend usando JWT
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        console.log("Mensagem enviada via API");
      })
      .catch((error) => {
        console.error("Erro ao enviar mensagem via API:", error);

        // Fallback para WebSocket se a API falhar
        if (stompClient.current) {
          console.log("Tentando enviar via WebSocket");
          stompClient.current.publish({
            destination: `/app/room.${id}.message`,
            body: JSON.stringify({
              content: mensagem,
            }),
          });
        }
      });

    setMensagem("");
  }

  function verUsuarios() {
    if (!connected) return;

    stompClient.current.publish({
      destination: `/app/room.${id}.users`,
      body: JSON.stringify({}),
    });
  }

  function kickUsuario(targetUser) {
    if (!connected || targetUser === username) {
      return alert("Você não pode se kickar!");
    }

    stompClient.current.publish({
      destination: `/app/room.${id}.kick`,
      body: JSON.stringify({
        targetUser,
      }),
    });
  }

  function sairSala() {
    if (connected) {
      stompClient.current.publish({
        destination: `/app/room.${id}.leave`,
        body: JSON.stringify({}),
      });
    }
    navigate("/Home");
  }

  return (
    <div className="container-sala">
      <header className="menu">
        <div className="custom-header-padding">
          <div className="logo-text">
            <img src="/chat.png" alt="logo" width={79} height={79} />
            <p className="title-sala">{nomeSala || `Sala ${id}`}</p>
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

      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <div className="mensagens">
        {mensagens.length === 0 ? (
          <div className="mensagem-vazia">Nenhuma mensagem ainda...</div>
        ) : (
          mensagens.map((msg, index) => (
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
          ))
        )}
      </div>

      {usuarios.length > 0 && (
        <div className="usuarios-popup">
          <h3>Usuários na sala:</h3>
          {usuarios.map((usuario) => (
            <div
              key={typeof usuario === "object" ? usuario.id : usuario}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>
                {typeof usuario === "object" ? usuario.login : usuario}
              </span>
              <button
                onClick={() =>
                  kickUsuario(
                    typeof usuario === "object" ? usuario.login : usuario
                  )
                }
              >
                Excluir
              </button>
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
            onKeyPress={(e) => e.key === "Enter" && enviarMensagem()}
          />
        </div>
      </footer>
    </div>
  );
}

export default Sala;
