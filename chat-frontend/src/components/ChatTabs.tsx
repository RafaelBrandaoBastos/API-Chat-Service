import React from "react";
import { useChatContext } from "../context/ChatContext";

const ChatTabs: React.FC = () => {
  const { state, setActiveTab } = useChatContext();
  const { activeTab } = state;

  const handleTabChange = (tab: "rooms" | "direct") => {
    // Evitar redefinir a mesma tab
    if (activeTab === tab) {
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="bg-gray-200 flex border-b border-gray-300">
      <button
        onClick={() => handleTabChange("rooms")}
        className={`flex-1 py-3 px-4 font-medium text-sm focus:outline-none transition-colors ${
          activeTab === "rooms"
            ? "bg-gray-50 text-blue-600 border-t-2 border-blue-500"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-selected={activeTab === "rooms"}
        role="tab"
      >
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Chat Rooms
        </div>
      </button>
      <button
        onClick={() => handleTabChange("direct")}
        className={`flex-1 py-3 px-4 font-medium text-sm focus:outline-none transition-colors ${
          activeTab === "direct"
            ? "bg-gray-50 text-blue-600 border-t-2 border-blue-500"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        aria-selected={activeTab === "direct"}
        role="tab"
      >
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          Direct Messages
        </div>
      </button>
    </div>
  );
};

export default ChatTabs;
