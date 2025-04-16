import "./Home.css";

function Home() {
  return (
    <div className="container">
      <header className="menu">
        <div className="logo-text">
          <img src="/chat.png" alt="logo" width={79} height={79}></img>
          <p> Olá, Rafael</p>
        </div>
        <button>Logout</button>
      </header>
      <div className = "">
        <button className="novo-chat">Novo Chat +</button>
      </div>
    </div>
  );
}

export default Home;
