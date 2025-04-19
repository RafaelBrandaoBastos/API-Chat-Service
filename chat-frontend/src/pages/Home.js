import "./Home.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useState, useContext, useEffect, useRef } from "react";
import { ChatContext } from "../contexts/ChatContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  NestJSApiEndpoint,
  NestJSRoomsEndpoint,
  NestJSWsEndpoint,
} from "../endpoints/Endpoint";

function Home() {
  const navigate = useNavigate();
  const { username, logout, token } = useContext(UserContext);
  const { chats, setChats } = useContext(ChatContext);
  const [stompClient, setStompClient] = useState(null);
  const subscriptionsRef = useRef({}); // controla o que já está inscrito

  // Função para buscar as salas via fetch
  async function fetchSalas() {
    try {
      // Usar a API NestJS para obter as salas
      const res = await fetch(`${NestJSRoomsEndpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Falha ao obter as salas");
      }

      const data = await res.json();
      setChats(data);

      // Após receber as salas, inscrever nas novas (se já estiver conectado)
      if (stompClient && stompClient.connected) {
        data.forEach((chat) => {
          if (!subscriptionsRef.current[chat.id]) {
            const sub = stompClient.subscribe(
              `/topic/room.${chat.id}`,
              (message) => {
                const msg = JSON.parse(message.body);
                alert(`[${chat.name}] ${msg.sender.login}: ${msg.content}`);
              }
            );
            subscriptionsRef.current[chat.id] = sub;
          }
        });
      }
    } catch (err) {
      console.error("Erro ao buscar salas:", err);
    }
  }

  // Carrega salas periodicamente
  useEffect(() => {
    fetchSalas();
    const interval = setInterval(fetchSalas, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Conecta no WebSocket após carregar componente
  useEffect(() => {
    if (!token) return;

    // Adiciona o token como cabeçalho nos conectores websocket
    const socket = new SockJS(NestJSWsEndpoint);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("✅ Conectado ao WebSocket");
        setStompClient(client);

        // Inscreve nas salas já existentes
        chats.forEach((chat) => {
          if (!subscriptionsRef.current[chat.id]) {
            const sub = client.subscribe(
              `/topic/room.${chat.id}`,
              (message) => {
                const msg = JSON.parse(message.body);
                alert(`[${chat.name}] ${msg.sender.login}: ${msg.content}`);
              }
            );
            subscriptionsRef.current[chat.id] = sub;
          }
        });
      },
      onWebSocketError: (err) => {
        console.error("❌ WebSocket Error:", err);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
      console.log("🔌 WebSocket desconectado");
    };
  }, [token, chats]);

  // Função de logout
  function handleLogout() {
    if (stompClient) {
      stompClient.deactivate();
    }
    logout();
    navigate("/");
  }

  function entrarChat(id) {
    navigate(`/chats/${id}`);
  }

  function excluirChat(id) {
    // Enviar requisição para excluir a sala no backend
    fetch(`${NestJSRoomsEndpoint}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Atualizar a UI após a exclusão bem-sucedida
          const novaLista = chats.filter((chat) => chat.id !== id);
          setChats(novaLista);
        } else {
          console.error("Erro ao excluir sala:", response.statusText);
        }
      })
      .catch((err) => {
        console.error("Erro ao excluir sala:", err);
      });
  }

  function criarSala() {
    const nomeSala =
      prompt("Digite o nome da nova sala:") || `Chat ${chats.length + 1}`;

    // Enviar requisição para criar nova sala no backend
    fetch(`${NestJSRoomsEndpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nomeSala }),
    })
      .then((response) => response.json())
      .then((novaSala) => {
        setChats([...chats, novaSala]);
      })
      .catch((err) => {
        console.error("Erro ao criar sala:", err);
      });
  }

  return (
    <div className="container">
      <header className="menu">
        <div className="custom-header-padding">
          <div className="logo-text">
            <img src="/chat.png" alt="logo" width={79} height={79} />
            <p> Olá, {username}</p>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="chat-container">
        <button onClick={criarSala} className="novo-chat">
          <p>Novo Chat +</p>
        </button>

        <div className="lista-chats">
          {chats.map((chat) => (
            <div key={chat.id} className="chat-item">
              <span>{chat.name}</span>
              <div className="chat-buttons">
                <button
                  onClick={() => excluirChat(chat.id)}
                  className="excluir"
                >
                  Excluir
                </button>
                <button onClick={() => entrarChat(chat.id)} className="entrar">
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
