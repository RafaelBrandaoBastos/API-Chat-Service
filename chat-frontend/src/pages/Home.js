import "./Home.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useState, useContext, useEffect, useRef } from "react";
import { ChatContext } from "../contexts/ChatContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { LocalChatEndpoint } from "../endpoints/Endpoint";

function Home() {
  const navigate = useNavigate();
  const { username, setUsername } = useContext(UserContext);
  const { chats, setChats } = useContext(ChatContext);
  const [stompClient, setStompClient] = useState(null);
  const subscriptionsRef = useRef({}); // controla o que já está inscrito

  // Função para buscar as salas via fetch
  async function fetchSalas() {
    try {
      const res = await fetch(`${LocalChatEndpoint}/sala`);
      const data = await res.json();
      setChats(data);

      // Após receber as salas, inscrever nas novas (se já estiver conectado)
      if (stompClient && stompClient.connected) {
        data.forEach((chat) => {
          if (!subscriptionsRef.current[chat.id]) {
            const sub = stompClient.subscribe(
              `/topic/${chat.id}`,
              (message) => {
                const msg = JSON.parse(message.body);
                alert(`[${chat.nome}] ${msg.sender}: ${msg.content}`);
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
    const interval = setInterval(fetchSalas, 2000);
    return () => clearInterval(interval);
  }, []);

  // Conecta no WebSocket após carregar componente
  useEffect(() => {
    const socket = new SockJS(`${LocalChatEndpoint}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log("✅ Conectado ao WebSocket");
        setStompClient(client);

        // Inscreve nas salas já existentes
        chats.forEach((chat) => {
          if (!subscriptionsRef.current[chat.id]) {
            const sub = client.subscribe(`/topic/${chat.id}`, (message) => {
              const msg = JSON.parse(message.body);
              alert(`[${chat.nome}] ${msg.sender}: ${msg.content}`);
            });
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
  }, []);

  // Função de logout
  function logoff() {
    setUsername(null);
    if (stompClient) {
      stompClient.deactivate();
    }
    navigate("/");
  }

  function entrarChat(id) {
    navigate(`/chats/${id}`);
  }

  function excluirChat(id) {
    const novaLista = chats.filter((chat) => chat.id !== id);
    setChats(novaLista);
  }

  function criarSala() {
    const nomeSala =
      prompt("Digite o nome da nova sala:") || `Chat ${chats.length + 1}`;
    const novoChat = {
      id: chats.length + 1,
      nome: nomeSala,
    };
    setChats([...chats, novoChat]);
  }

  return (
    <div className="container">
      <header className="menu">
        <div className="custom-header-padding">
          <div className="logo-text">
            <img src="/chat.png" alt="logo" width={79} height={79} />
            <p> Olá, {username}</p>
          </div>
          <button onClick={logoff}>Logout</button>
        </div>
      </header>

      <div className="chat-container">
        <button onClick={criarSala} className="novo-chat">
          <p>Novo Chat +</p>
        </button>

        <div className="lista-chats">
          {chats.map((chat) => (
            <div key={chat.id} className="chat-item">
              <span>{chat.nome}</span>
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
