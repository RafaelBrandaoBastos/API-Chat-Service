import "./Home.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useState, useContext} from "react";

function Home() {
  const navigate = useNavigate();
  const { username, setUsername } = useContext(UserContext);

  const [chats, setChats] = useState([]);

  function logoff() {
    setUsername(null);
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
    const novoChat = {
      id: chats.length + 1,
      nome: `Chat ${chats.length + 1}`,
    };
    setChats([...chats, novoChat]);
  }

  return (
    <div className="container">
      <header className="menu">
        <div className="logo-text">
          <img src="/chat.png" alt="logo" width={79} height={79} />
          <p>Olá, {username}</p>
        </div>
        <button type="button" onClick={logoff}>
          Logout
        </button>
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
