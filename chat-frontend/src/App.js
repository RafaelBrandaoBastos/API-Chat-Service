import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./protectedRouter";
import { UserProvider } from "./contexts/UserContext";
import Sala from "./pages/Sala";
import { ChatProvider } from "./contexts/ChatContext";

// Componente que envolve as rotas com os providers necessários
function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Cadastro" element={<Cadastro />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/Home" element={<Home />} />
          <Route path="/chats/:id" element={<Sala />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <div className="App">
      <UserProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </UserProvider>
    </div>
  );
}

export default App;
