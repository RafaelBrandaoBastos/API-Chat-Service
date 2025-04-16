import "./Home.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useState, useContext, useEffect } from "react";

function Home() {
  const { username } = useContext(UserContext);
  const { setUsername } = useContext(UserContext);
  function logoff() {
    setUsername(null);
    navigate("/");
  }
  const navigate = useNavigate();
  return (
    <div className="container">
      <header className="menu">
        <div className="custom-header-padding">
          <div className="logo-text">
            <img src="/chat.png" alt="logo" width={79} height={79}></img>
            <p> Olá, {username}</p>
          </div>
          <button type="button" onClick={() => logoff()}>
            Logout
          </button>
        </div>
      </header>
      <div className="">
        <button className="novo-chat">Novo Chat +</button>
      </div>
    </div>
  );
}

export default Home;
