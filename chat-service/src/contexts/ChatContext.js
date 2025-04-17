// src/contexts/ChatContext.js
import { createContext, useState } from "react";

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([]);
  return (
    <ChatContext.Provider value={{ chats, setChats }}>
      {children}
    </ChatContext.Provider>
  );
}
