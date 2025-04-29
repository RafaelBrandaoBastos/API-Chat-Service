import React, { useState, useEffect } from "react";
import { ChatProvider, useChatContext } from "./context/ChatContext";
import LoginForm from "./components/LoginForm";
import ChatLayout from "./components/ChatLayout";

// Main app content component that uses the context
const AppContent: React.FC = () => {
  const { state } = useChatContext();
  const { currentUser, loading } = state;
  const [initialLoading, setInitialLoading] = useState(true);

  // Effect to handle initial loading state
  useEffect(() => {
    // Check if we have user credentials in localStorage
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (userId && token) {
      // We have credentials, so wait for context to load them
      if (!loading && (currentUser || state.error)) {
        // Either loaded user or got an error, done with initial loading
        setInitialLoading(false);
      }
    } else {
      // No credentials, no need to wait
      setInitialLoading(false);
    }
  }, [loading, currentUser, state.error]);

  // Show loading indicator during initial load
  if (initialLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
          <h1 className="text-xl font-medium text-gray-700 mb-1">Chat App</h1>
          <p className="text-sm text-gray-500">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!currentUser) {
    return <LoginForm />;
  }

  // Show chat interface if authenticated
  return <ChatLayout />;
};

// Main App component with context provider
const App: React.FC = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default App;
