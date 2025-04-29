import React, { useState, useEffect } from "react";
import { useChatContext } from "../context/ChatContext";
import { User, Message } from "../types";

interface UserChatPreview {
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
}

const UsersList: React.FC = () => {
  const {
    state,
    selectUser,
    getAllUsers,
    getDirectMessagesPreviews,
    setError,
  } = useChatContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [chatPreviews, setChatPreviews] = useState<UserChatPreview[]>([]);

  // Load users for the modal only when requested
  const handleOpenUserModal = async () => {
    try {
      setIsLoading(true);
      await getAllUsers();
      setShowUserModal(true);
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users list");
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat previews on mount and when current user changes
  useEffect(() => {
    const loadChatPreviews = async () => {
      if (!state.currentUser) return;

      try {
        setIsLoading(true);
        const previews = await getDirectMessagesPreviews();
        setChatPreviews(previews);
      } catch (error) {
        console.error("Error loading chat previews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatPreviews();
    // Only depend on currentUser to avoid infinite loops
  }, [state.currentUser, getDirectMessagesPreviews]);

  // Update current chat whenever a user is selected and not in the previews
  useEffect(() => {
    if (
      state.selectedUser &&
      !chatPreviews.some(
        (preview) => preview.user.id === state.selectedUser?.id
      )
    ) {
      setChatPreviews((prev) => [
        {
          user: state.selectedUser!,
          lastMessage: null,
          unreadCount: 0,
        },
        ...prev,
      ]);
    }
  }, [state.selectedUser, chatPreviews]);

  // Filter users based on search term
  const filteredUsers = state.users.filter(
    (user) =>
      user.id !== state.currentUser?.id &&
      user.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    selectUser(user);
    setShowUserModal(false);
  };

  // Format timestamp to display like WhatsApp (today: HH:MM, earlier: DD/MM/YY)
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return "";

    const messageDate = new Date(timestamp);
    const today = new Date();

    // Check if message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Check if message is from this week
    const daysDiff = Math.floor(
      (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: "short" });
    }

    // Older messages
    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Get message preview (truncate if needed)
  const getMessagePreview = (message: Message | null) => {
    if (!message) return "";
    if (message.content.length <= 30) return message.content;
    return message.content.substring(0, 27) + "...";
  };

  return (
    <div className="h-full bg-gray-50 border-r border-gray-300">
      <div className="p-4 bg-emerald-600 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={handleOpenUserModal}
            className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none hover:bg-gray-100"
            aria-label="New chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-emerald-700 text-white placeholder-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-emerald-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-6rem)]">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : chatPreviews.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {chatPreviews
              .filter(
                (preview) =>
                  !searchTerm ||
                  preview.user.login
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              )
              .map((preview) => (
                <li
                  key={preview.user.id}
                  onClick={() => handleSelectUser(preview.user)}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors
                    ${
                      state.selectedUser?.id === preview.user.id
                        ? "bg-emerald-50"
                        : "hover:bg-gray-100"
                    }
                  `}
                  tabIndex={0}
                  role="button"
                  aria-label={`Chat with ${preview.user.login}`}
                >
                  <div className="flex items-start">
                    <div className="relative">
                      <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        {preview.user.login.charAt(0).toUpperCase()}
                      </div>
                      {preview.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {preview.unreadCount > 9 ? "9+" : preview.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {preview.user.login}
                        </h3>
                        {preview.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(preview.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate ${
                          preview.unreadCount > 0
                            ? "font-medium text-gray-800"
                            : "text-gray-500"
                        }`}
                      >
                        {preview.lastMessage
                          ? getMessagePreview(preview.lastMessage)
                          : "No messages yet"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>Click the + button to start a conversation</p>
          </div>
        )}

        {state.error && (
          <div className="m-4 p-2 text-xs text-red-600 bg-red-50 rounded">
            {state.error}
          </div>
        )}
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-80 max-w-md max-h-[70vh] flex flex-col">
            <div className="p-4 bg-emerald-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">New Chat</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-white hover:text-gray-200"
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-emerald-700 text-white placeholder-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                      tabIndex={0}
                      role="button"
                      aria-label={`Select ${user.login}`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mr-3">
                          {user.login.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {user.login}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-600">
                  {searchTerm
                    ? "No users found"
                    : "No users available for chat"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
