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
  const [usaWebSocket, setUsaWebSocket] = useState(true);
  const [tentativasConexao, setTentativasConexao] = useState(0);

  // Debug do token para verificar se está sendo enviado corretamente - roda apenas uma vez
  useEffect(() => {
    // Logar apenas uma vez na inicialização
    console.log("Sala inicializada com ID:", id);
    console.log("Token disponível:", token ? "Sim" : "Não");
  }, []); // Array vazio significa que só executa uma vez

  // Buscar informações da sala
  useEffect(() => {
    console.log("Buscando informações da sala:", id);
    fetch(`${NestJSRoomsEndpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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
        setErrorMsg(`Erro ao carregar informações da sala: ${err.message}`);
      });

    // Buscar mensagens anteriores via REST
    carregarMensagens();
  }, [id, token]);

  const carregarMensagens = () => {
    console.log(
      `Buscando mensagens da sala: ${NestJSRoomsEndpoint}/${id}/messages`
    );

    fetch(`${NestJSRoomsEndpoint}/${id}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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
        console.log("Mensagens recebidas via REST:", data);
        if (Array.isArray(data)) {
          setMensagens(
            data.map((msg) => ({
              nome: msg.sender?.login || "Usuário",
              texto: msg.content,
              timestamp: new Date(msg.createdAt),
            }))
          );
          setErrorMsg("");
        } else {
          console.error("Formato de resposta inválido:", data);
          setErrorMsg("Formato de mensagens inválido");
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar mensagens:", err);
        setErrorMsg(`Erro ao carregar mensagens: ${err.message}`);
      });
  };

  // Configurar conexão WebSocket
  useEffect(() => {
    if (!token || !usaWebSocket) {
      setConnected(false);
      return;
    }

    try {
      console.log(
        `Tentativa ${tentativasConexao + 1} de conectar ao WebSocket`
      );

      // Usar SockJS para compatibilidade com mais navegadores
      const socket = new SockJS(NestJSWsEndpoint);

      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: function (str) {
          console.log("STOMP DEBUG: " + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("✅ Conectado ao WebSocket na sala");
          stompClient.current = client;
          setConnected(true);
          setErrorMsg("");
          setTentativasConexao(0);

          // Inscrever para receber mensagens da sala
          client.subscribe(`/topic/room.${id}`, (message) => {
            try {
              const msgData = JSON.parse(message.body);
              console.log("Nova mensagem via WebSocket:", msgData);
              setMensagens((prev) => [
                ...prev,
                {
                  nome: msgData.sender?.login || "Usuário",
                  texto: msgData.content,
                  timestamp: new Date(msgData.createdAt || Date.now()),
                },
              ]);
            } catch (error) {
              console.error("Erro ao processar mensagem:", error, message.body);
            }
          });

          // Inscrever para eventos do sistema
          client.subscribe(`/topic/room.${id}.system`, (message) => {
            try {
              const systemData = JSON.parse(message.body);
              console.log("Mensagem de sistema via WebSocket:", systemData);

              if (systemData.message || systemData.content) {
                setMensagens((prev) => [
                  ...prev,
                  {
                    nome: "⚠️ Sistema",
                    texto: systemData.content || systemData.message,
                    timestamp: new Date(),
                  },
                ]);
              }

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
            } catch (error) {
              console.error(
                "Erro ao processar evento de sistema:",
                error,
                message.body
              );
            }
          });

          // Informar servidor que entrou na sala
          try {
            client.publish({
              destination: `/app/room.${id}.join`,
              body: JSON.stringify({}),
            });
            console.log("Notificação de entrada enviada");
          } catch (err) {
            console.error("Erro ao notificar entrada na sala:", err);
          }
        },
        onWebSocketError: (error) => {
          console.error("❌ WebSocket Error:", error);
          setErrorMsg(
            `Erro na conexão WebSocket: ${error.message || "desconhecido"}`
          );
          setConnected(false);

          if (tentativasConexao < 2) {
            setTentativasConexao((prev) => prev + 1);
          }
        },
        onStompError: (frame) => {
          console.error("❌ STOMP Error:", frame);
          setErrorMsg(
            `Erro STOMP: ${frame.headers?.message || "Desconhecido"}`
          );
          setConnected(false);
        },
      });

      console.log("Ativando conexão STOMP...");
      client.activate();

      return () => {
        if (client.connected) {
          try {
            // Informar servidor que saiu da sala
            client.publish({
              destination: `/app/room.${id}.leave`,
              body: JSON.stringify({}),
            });
            console.log("Notificação de saída enviada");
          } catch (err) {
            console.error("Erro ao notificar saída:", err);
          }
        }
        client.deactivate();
        console.log("🔌 WebSocket desconectado");
      };
    } catch (error) {
      console.error("Erro crítico ao configurar WebSocket:", error);
      setErrorMsg(`Falha ao iniciar conexão WebSocket: ${error.message}`);
      setConnected(false);
    }
  }, [id, token, username, navigate, usaWebSocket, tentativasConexao]);

  function enviarMensagem() {
    if (!mensagem.trim()) return;
    setErrorMsg("");

    console.log("Enviando mensagem para sala:", id);

    // Enviando via REST
    fetch(`${NestJSRoomsEndpoint}/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: mensagem,
        senderId: localStorage.getItem("userId"),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`Erro ${response.status}:`, response.statusText);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        console.log("Mensagem enviada via REST API");

        // Após enviar com sucesso, recarregar mensagens
        if (!usaWebSocket) {
          setTimeout(carregarMensagens, 500);
        }

        return response.json();
      })
      .then((data) => {
        console.log("Resposta do envio:", data);

        // Adicionar a mensagem à lista local para feedback imediato
        if (!usaWebSocket) {
          setMensagens((prev) => [
            ...prev,
            {
              nome: username,
              texto: mensagem,
              timestamp: new Date(),
            },
          ]);
        }
      })
      .catch((error) => {
        console.error("Erro ao enviar mensagem via REST:", error);
        setErrorMsg(`Erro ao enviar mensagem: ${error.message}`);

        // Fallback para WebSocket se a API falhar
        if (stompClient.current && connected) {
          console.log("Tentando enviar via WebSocket");
          try {
            stompClient.current.publish({
              destination: `/app/room.${id}.message`,
              body: JSON.stringify({
                content: mensagem,
              }),
            });
            console.log("Mensagem enviada via WebSocket");

            // Adicionar a mensagem à lista para feedback imediato
            setMensagens((prev) => [
              ...prev,
              {
                nome: username,
                texto: mensagem,
                timestamp: new Date(),
              },
            ]);

            setErrorMsg(""); // Limpar erro se WebSocket funcionar
          } catch (wsError) {
            console.error("Erro ao enviar via WebSocket:", wsError);
            setErrorMsg(`Falha ao enviar: ${wsError.message}`);
          }
        }
      });

    setMensagem("");
  }

  function verUsuarios() {
    if (!connected && usaWebSocket) {
      setErrorMsg("Aguarde a conexão WebSocket");
      return;
    }

    try {
      if (stompClient.current) {
        stompClient.current.publish({
          destination: `/app/room.${id}.users`,
          body: JSON.stringify({}),
        });
      } else {
        setErrorMsg("Cliente WebSocket não disponível");
      }
    } catch (error) {
      console.error("Erro ao solicitar usuários:", error);
      setErrorMsg("Erro ao listar usuários");
    }
  }

  function kickUsuario(targetUser) {
    if (!connected && usaWebSocket) {
      setErrorMsg("Aguarde a conexão WebSocket");
      return;
    }

    if (targetUser === username) {
      setErrorMsg("Você não pode se kickar!");
      return;
    }

    try {
      if (stompClient.current) {
        stompClient.current.publish({
          destination: `/app/room.${id}.kick`,
          body: JSON.stringify({
            targetUser,
          }),
        });
      } else {
        setErrorMsg("Cliente WebSocket não disponível");
      }
    } catch (error) {
      console.error("Erro ao kickar usuário:", error);
      setErrorMsg("Erro ao remover usuário");
    }
  }

  function sairSala() {
    if (connected && stompClient.current) {
      try {
        stompClient.current.publish({
          destination: `/app/room.${id}.leave`,
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error("Erro ao sair da sala:", error);
      }
    }
    navigate("/Home");
  }

  function alternarModo() {
    setUsaWebSocket(!usaWebSocket);
    if (!usaWebSocket) {
      setErrorMsg("Modo WebSocket ativado");
    } else {
      setErrorMsg("Modo REST API ativado");
      carregarMensagens();
    }
  }

  function atualizarMensagens() {
    setErrorMsg("");
    carregarMensagens();
  }

  function reconectarWebSocket() {
    if (usaWebSocket) {
      setTentativasConexao((prev) => prev + 1);
      setErrorMsg("Tentando reconectar...");
    }
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
            <button className="sala-buttons" onClick={alternarModo}>
              {usaWebSocket ? "Usar REST" : "Usar WebSocket"}
            </button>
            {!usaWebSocket && (
              <button className="sala-buttons" onClick={atualizarMensagens}>
                Atualizar
              </button>
            )}
            {usaWebSocket && !connected && (
              <button className="sala-buttons" onClick={reconectarWebSocket}>
                Reconectar
              </button>
            )}
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

      <div className="status-indicator">
        Modo: {usaWebSocket ? "WebSocket" : "REST API"}
        {usaWebSocket && (
          <span
            className={`connection-status ${
              connected ? "connected" : "disconnected"
            }`}
          >
            ({connected ? "Conectado" : "Desconectado"})
          </span>
        )}
      </div>

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
