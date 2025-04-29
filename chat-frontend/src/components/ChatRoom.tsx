import React, { useState, useRef, useEffect } from "react";
import { useChatContext } from "../context/ChatContext";
import { User } from "../types";

const ChatRoom: React.FC = () => {
  const { state, sendMessage, setError } = useChatContext();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedRoom, messages, currentUser } = state;

  // Debug messages in component
  useEffect(() => {
    console.log("ChatRoom rendering with:", {
      selectedRoom: selectedRoom?.id,
      messageCount: messages.length,
      messages,
    });
  }, [selectedRoom, messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to send messages");
      return;
    }

    if (!selectedRoom) {
      setError("You must select a room to send messages");
      return;
    }

    if (!message.trim()) {
      return;
    }

    try {
      console.log(
        `Attempting to send message: "${message.trim()}" to room: ${
          selectedRoom.id
        }`
      );
      await sendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper function to check if message is from current user
  const isOwnMessage = (senderId: string) => {
    return currentUser?.id === senderId;
  };

  // Helper function to find sender name
  const getSenderName = (senderId: string, msg: any): string => {
    if (isOwnMessage(senderId)) {
      return "You";
    }

    // First try to use the sender object if it's available in the message
    if (msg.sender && msg.sender.login) {
      return msg.sender.login;
    }

    // Fallback to finding sender in room users
    const sender = selectedRoom?.users?.find((user) => user.id === senderId);
    return sender?.login || "Unknown User";
  };

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-xl font-medium text-gray-900">
            No room selected
          </h3>
          <p className="mt-1 text-gray-500">
            Select a room from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Room header */}
      <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedRoom.name}
          </h2>
          <p className="text-sm text-gray-600">
            {selectedRoom.users?.length || 0} member
            {(selectedRoom.users?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Room members dropdown */}
        <div className="relative group">
          <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700">
            Members
          </button>
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="py-1">
              {selectedRoom.users?.map((user: User) => (
                <div
                  key={user.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {user.login}
                  {user.id === currentUser?.id && " (You)"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  isOwnMessage(msg.senderId) ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                    isOwnMessage(msg.senderId)
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-300 rounded-bl-none"
                  }`}
                >
                  <div className="font-medium text-xs">
                    {getSenderName(msg.senderId, msg)} •{" "}
                    {formatTime(msg.createdAt)}
                  </div>
                  <p className="mt-1 break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input form */}
      <div className="bg-white border-t border-gray-300 p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
