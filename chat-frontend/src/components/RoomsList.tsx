import React, { useState, useEffect } from "react";
import { useChatContext } from "../context/ChatContext";
import { Room } from "../types";
import socketService from "../services/socket";

const RoomsList: React.FC = () => {
  const { state, selectRoom, createRoom, leaveRoom } = useChatContext();
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Debugging rooms list
  useEffect(() => {
    console.log("RoomsList component rendering with rooms:", state.rooms);

    // Reset local error and reloading state when rooms change
    setLocalError(null);
    setIsReloading(false);
  }, [state.rooms]);

  const handleReloadRooms = () => {
    setIsReloading(true);
    console.log("Manually reloading rooms list");
    socketService.getRooms();
    // State will be updated when the rooms event is received
  };

  const handleSelectRoom = (room: Room) => {
    console.log("Selecting room:", room);
    selectRoom(room);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      try {
        setLocalError(null);
        console.log("Creating new room:", newRoomName.trim());
        await createRoom(newRoomName.trim());
        setNewRoomName("");
        setIsCreatingRoom(false);
      } catch (error) {
        console.error("Error creating room:", error);
        setLocalError("Failed to create room. Please try again.");
      }
    }
  };

  const handleLeaveRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLocalError(null);
      console.log("Leaving room:", roomId);
      await leaveRoom(roomId);
    } catch (error) {
      console.error("Error leaving room:", error);
      setLocalError("Failed to leave room. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, room: Room) => {
    if (e.key === "Enter" || e.key === " ") {
      selectRoom(room);
    }
  };

  // Helper function to render room items
  const renderRooms = () => {
    if (!state.rooms || !Array.isArray(state.rooms)) {
      console.error("Invalid rooms data:", state.rooms);
      return <div className="p-4 text-red-600">Error loading rooms data</div>;
    }

    if (state.rooms.length === 0) {
      return (
        <div className="p-4 text-gray-600">
          No rooms yet. Create one to start chatting!
        </div>
      );
    }

    return (
      <ul className="space-y-1 p-2">
        {state.rooms.map((room) => (
          <li
            key={room.id}
            onClick={() => handleSelectRoom(room)}
            onKeyDown={(e) => handleKeyDown(e, room)}
            tabIndex={0}
            className={`
              p-3 rounded-md transition-colors cursor-pointer flex justify-between items-center
              ${
                state.selectedRoom?.id === room.id
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100 text-gray-800"
              }
            `}
            aria-label={`Select room ${room.name}`}
          >
            <span className="font-medium truncate">{room.name}</span>
            <button
              onClick={(e) => handleLeaveRoom(room.id, e)}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded"
              aria-label={`Leave room ${room.name}`}
            >
              Leave
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full bg-gray-50 border-r border-gray-300">
      <div className="p-4 border-b border-gray-300 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700">Your Rooms</h2>
          <button
            onClick={handleReloadRooms}
            className="p-1 rounded-full hover:bg-gray-200"
            disabled={isReloading}
            aria-label="Reload rooms"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-gray-600 ${
                isReloading ? "animate-spin" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setIsCreatingRoom(!isCreatingRoom)}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isCreatingRoom ? "Cancel" : "Create Room"}
        </button>

        {isCreatingRoom && (
          <form onSubmit={handleCreateRoom} className="mt-4">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={30}
              required
              autoFocus
            />
            <button
              type="submit"
              className="mt-2 w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Create
            </button>
          </form>
        )}
      </div>

      <div className="overflow-y-auto h-[calc(100%-5rem)]">
        {state.loading || isReloading ? (
          <div className="p-4 text-gray-600">
            {isReloading ? "Reloading rooms..." : "Loading rooms..."}
          </div>
        ) : (
          renderRooms()
        )}

        {(state.error || localError) && (
          <div className="mt-2 p-2 text-xs text-red-500 bg-red-50 rounded">
            {state.error || localError}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsList;
