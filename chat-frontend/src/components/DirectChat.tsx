import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChatContext } from "../context/ChatContext";
import { Message } from "../types";

const DirectChat: React.FC = () => {
  const [message, setMessage] = useState("");
  const { state, sendDirectMessage } = useChatContext();
  const { selectedUser, messages, currentUser } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local messages when server messages change
  useEffect(() => {
    setLocalMessages(messages);
    setPage(1);
    setHasMoreMessages(true);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive if already at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [localMessages, isAtBottom]);

  // Handle scroll events to detect when user is at bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isNearBottom);

    // Check if we're near the top to load more messages
    if (scrollTop < 100 && hasMoreMessages && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingMore]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
      return () => {
        messagesContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Focus the input when a user is selected
  useEffect(() => {
    if (selectedUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  const loadMoreMessages = async () => {
    // This would normally call an API with pagination
    setLoadingMore(true);

    // Simulate API delay
    setTimeout(() => {
      // For now this is a placeholder - would be replaced with actual API call
      // If no more messages to load
      setHasMoreMessages(false);
      setLoadingMore(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedUser && currentUser) {
      // Create optimistic local message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        createdAt: new Date().toISOString(),
      };

      // Add to local messages immediately
      setLocalMessages((prev) => [...prev, optimisticMessage]);

      // Send to server
      sendDirectMessage(message);
      setMessage("");

      // Ensure we're scrolled to bottom to see the new message
      setIsAtBottom(true);
    }
  };

  // Handle typing indicator
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Simulate typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  // Renderizar mensagem vazia se não houver usuário selecionado
  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-emerald-500 mx-auto mb-4"
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
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Start Messaging
          </h3>
          <p className="text-gray-500">
            Select a user from the sidebar to start a conversation
          </p>
        </div>
      </div>
    );
  }

  // Determine whether message is from current user or other user
  const renderMessage = (msg: Message) => {
    const isCurrentUser = msg.senderId === currentUser?.id;
    const messageTime = new Date(msg.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isConsecutive = (index: number) => {
      if (index === 0) return false;
      const prevMsg = localMessages[index - 1];
      return prevMsg.senderId === msg.senderId;
    };

    const msgIndex = localMessages.findIndex((m) => m.id === msg.id);
    const hideAvatar = isConsecutive(msgIndex);

    return (
      <div
        key={msg.id}
        className={`flex mb-1 ${
          isCurrentUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isCurrentUser && !hideAvatar && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center mr-2 self-end mb-1">
            {selectedUser.login.charAt(0).toUpperCase()}
          </div>
        )}
        {!isCurrentUser && hideAvatar && <div className="w-8 mr-2"></div>}

        <div
          className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md relative ${
            isCurrentUser
              ? "bg-emerald-100 text-gray-800"
              : "bg-white text-gray-800"
          } ${
            hideAvatar
              ? isCurrentUser
                ? "rounded-tr-sm"
                : "rounded-tl-sm"
              : ""
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {msg.content}
          </p>
          <span className={`text-xs block text-right mt-1 text-gray-500`}>
            {messageTime}
            {isCurrentUser && <span className="ml-1 text-emerald-500">✓✓</span>}
          </span>

          {/* Message tail */}
          {!hideAvatar && (
            <div
              className={`absolute bottom-0 ${
                isCurrentUser ? "-right-2" : "-left-2"
              } w-4 h-4 overflow-hidden`}
            >
              <div
                className={`absolute transform rotate-45 w-3 h-3 ${
                  isCurrentUser ? "bg-emerald-100" : "bg-white"
                }`}
                style={{
                  bottom: "6px",
                  [isCurrentUser ? "right" : "left"]: "6px",
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDateSeparator = (date: string) => {
    return (
      <div className="flex items-center justify-center my-4">
        <div className="bg-gray-300 text-xs text-gray-600 rounded-full px-4 py-1 shadow-sm">
          {new Date(date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year:
              new Date(date).getFullYear() !== new Date().getFullYear()
                ? "numeric"
                : undefined,
          })}
        </div>
      </div>
    );
  };

  // Group messages by date for date separators
  const groupedMessages = localMessages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center bg-emerald-600 text-white">
        <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center mr-3">
          {selectedUser.login.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-medium">{selectedUser.login}</h2>
          {isTyping ? (
            <p className="text-xs text-emerald-200">typing...</p>
          ) : (
            <p className="text-xs text-emerald-200">online</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            className="p-2 rounded-full hover:bg-emerald-700 transition-colors"
            aria-label="Search in conversation"
          >
            <svg
              className="w-5 h-5"
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
          </button>
          <button
            className="p-2 rounded-full hover:bg-emerald-700 transition-colors"
            aria-label="More options"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-100 bg-opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f1f1f1' fill-opacity='0.5' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      >
        {loadingMore && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">
              Loading older messages...
            </span>
          </div>
        )}

        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-emerald-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-gray-600">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(date)}
              {msgs.map((msg, idx) => renderMessage(msg))}
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />

        {isTyping && (
          <div className="flex ml-10 my-2">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {!isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 bg-emerald-500 text-white rounded-full p-2 shadow-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Message input form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex items-center">
          <button
            type="button"
            className="text-gray-400 hover:text-emerald-500 p-2 rounded-full focus:outline-none"
            aria-label="Add emoji"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-emerald-500 p-2 rounded-full focus:outline-none"
            aria-label="Attach file"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              ></path>
            </svg>
          </button>

          <div className="flex-1 mx-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleChange}
              placeholder="Type a message..."
              className="w-full py-2 px-4 bg-gray-100 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {message.trim() ? (
            <button
              type="submit"
              className="bg-emerald-500 text-white p-2 rounded-full focus:outline-none hover:bg-emerald-600"
              aria-label="Send message"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                ></path>
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="text-gray-400 hover:text-emerald-500 p-2 rounded-full focus:outline-none"
              aria-label="Voice message"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                ></path>
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DirectChat;
