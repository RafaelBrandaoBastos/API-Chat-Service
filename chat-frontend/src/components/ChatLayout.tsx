import React, { useEffect } from "react";
import Header from "./Header";
import RoomsList from "./RoomsList";
import UsersList from "./UsersList";
import ChatRoom from "./ChatRoom";
import DirectChat from "./DirectChat";
import ChatTabs from "./ChatTabs";
import { useChatContext } from "../context/ChatContext";

const ErrorModal: React.FC<{
  error: string;
  onRefresh: () => void;
}> = ({ error, onRefresh }) => {
  return (
    <div className="flex items-center justify-center bg-red-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-red-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-xl font-medium text-red-800 mb-2">Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

const ChatLayout: React.FC = () => {
  const { state, logout, reconnectSocket } = useChatContext();

  // Check for authentication errors and handle them
  useEffect(() => {
    if (
      state.error?.includes("não autenticado") ||
      state.error?.includes("not authenticated") ||
      state.error?.includes("authentication failed")
    ) {
      // If auth error, clear localStorage and reload
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      logout();
    }
  }, [state.error, logout]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (
      state.error?.includes("não autenticado") ||
      state.error?.includes("not authenticated") ||
      state.error?.includes("authentication failed")
    ) {
      // For auth errors, logout first
      logout();
    }
    window.location.reload();
  };

  // Show an error message if there is one
  if (state.error) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <ErrorModal error={state.error} onRefresh={handleRefresh} />
        </div>
      </div>
    );
  }

  // Render appropriate sidebar based on active tab
  const renderSidebar = () => {
    if (state.activeTab === "direct") {
      return <UsersList />;
    }
    return <RoomsList />;
  };

  // Render appropriate chat component based on active tab and selection
  const renderChatArea = () => {
    if (state.activeTab === "direct") {
      return <DirectChat />;
    }
    return <ChatRoom />;
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <ChatTabs />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 md:w-80 flex-shrink-0 h-full">
          {renderSidebar()}
        </div>
        <div className="flex-1 h-full">{renderChatArea()}</div>
      </div>
    </div>
  );
};

export default ChatLayout;
