import React from "react";
import { useChatContext } from "../context/ChatContext";

const Header: React.FC = () => {
  const { state, logout, reconnectSocket } = useChatContext();
  const { currentUser } = state;

  const handleLogout = () => {
    logout();
  };

  const handleReconnect = async () => {
    await reconnectSocket();
  };

  return (
    <header className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
        <h1 className="text-xl font-bold">Chat App</h1>
      </div>

      {currentUser && (
        <div className="flex items-center">
          <span className="hidden sm:inline mr-4">
            Logged in as <strong>{currentUser.login}</strong>
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleReconnect}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded-md text-sm"
            >
              Reconnect
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 hover:bg-red-400 rounded-md text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
