import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Room, Message, ChatState, User } from "../types";
import * as api from "../services/api";
import socketService from "../services/socket";

// Initial state
const initialState: ChatState = {
  currentUser: null,
  rooms: [],
  selectedRoom: null,
  selectedUser: null,
  messages: [],
  users: [],
  loading: false,
  error: null,
  activeTab: "rooms",
};

// Define context types
interface ChatContextProps {
  state: ChatState;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  register: (login: string, password: string) => Promise<void>;
  createRoom: (name: string) => Promise<void>;
  enterRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendDirectMessage: (content: string) => Promise<void>;
  selectRoom: (room: Room | null) => void;
  selectUser: (user: User | null) => void;
  setActiveTab: (tab: "rooms" | "direct") => void;
  setError: (error: string | null) => void;
  getAllUsers: () => Promise<void>;
  reconnectSocket: () => Promise<void>;
  getDirectMessagesPreviews: () => Promise<UserChatPreview[]>;
}

// UserChatPreview interface for WhatsApp-like message previews
interface UserChatPreview {
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
}

// Create context
const ChatContext = createContext<ChatContextProps | undefined>(undefined);

// Create provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<ChatState>(initialState);

  // Load user from localStorage on component mount
  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (userId && token) {
        try {
          console.log("Found saved credentials, attempting to restore session");
          setState((prevState) => ({ ...prevState, loading: true }));

          // First fetch the user data to confirm credentials are still valid
          const user = await api.getUserById(userId);

          console.log("User data loaded successfully:", user);

          // Update state with user info
          setState((prevState) => ({
            ...prevState,
            currentUser: user,
            loading: false,
          }));

          // Connect socket and handle connection failure
          const socketConnected = await connectSocket(userId);
          if (!socketConnected) {
            console.error("Socket connection failed after loading user");
            // Could handle reconnection or show a connection warning here
          }
        } catch (error) {
          console.error("Error loading user:", error);
          setState((prevState) => ({
            ...prevState,
            error: "Failed to load user data",
            loading: false,
          }));
          // Clear storage on error
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
        }
      } else {
        // If either token or userId is missing, clean up localStorage
        if (userId || token) {
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
        }
        // Ensure state is reset when no user is found
        setState((prevState) => ({
          ...prevState,
          currentUser: null,
          rooms: [],
          selectedRoom: null,
          messages: [],
          loading: false,
        }));
      }
    };

    loadUser();

    // Cleanup function
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Connect to WebSocket with authentication handling
  const connectSocket = async (userId: string): Promise<boolean> => {
    try {
      console.log(`Attempting to connect socket for user ${userId}`);

      // Attempt to connect with the userId
      await socketService.connect(userId);

      // Set up error and authentication event listeners
      socketService.on("error", (error: any) => {
        console.error("Socket error received:", error);

        // Check if error is authentication related
        if (error.message && error.message.includes("autenticado")) {
          console.error("Authentication error in socket connection");

          // Show error to user
          setState((prevState) => ({
            ...prevState,
            error: error.message || "Falha de autenticação no socket",
          }));
        }
      });

      // Set up authenticated event listener
      socketService.on("authenticated", (data: any) => {
        console.log("Socket authenticated successfully:", data);

        // Clear any authentication errors
        setState((prevState) => ({
          ...prevState,
          error: null,
        }));

        // Make sure to request rooms after authentication
        console.log("Authenticated, requesting user rooms...");
        socketService.getRooms();
      });

      // Set up direct message listener
      socketService.on("directMessage", (message: Message) => {
        console.log("Received direct message:", message);

        setState((prevState) => {
          // Only add the message if it's related to the currently selected user
          if (
            (prevState.selectedUser?.id === message.senderId &&
              message.receiverId === prevState.currentUser?.id) ||
            (prevState.selectedUser?.id === message.receiverId &&
              message.senderId === prevState.currentUser?.id)
          ) {
            return {
              ...prevState,
              messages: [...prevState.messages, message],
            };
          }
          return prevState;
        });
      });

      // Set up direct messages list listener
      socketService.on("directMessages", (data: { messages: Message[] }) => {
        console.log(`Received ${data.messages.length} direct messages`);
        setState((prevState) => ({
          ...prevState,
          messages: data.messages,
          loading: false,
        }));
      });

      // Room related event listeners
      socketService.on("rooms", (data: Room[]) => {
        console.log("Received rooms data:", data);

        // Additional validation and logging
        if (!data || !Array.isArray(data)) {
          console.error("Invalid rooms data received:", data);
          return;
        }

        if (data.length === 0) {
          console.log("No rooms available for the user");
        } else {
          console.log(
            `Received ${data.length} rooms:`,
            data.map((r) => ({ id: r.id, name: r.name }))
          );
        }

        // Always update rooms, even if empty array
        setState((prevState) => ({
          ...prevState,
          rooms: data,
          loading: false,
        }));
      });

      socketService.on("joinedRoom", (data: { room: Room }) => {
        console.log("Joined room:", data.room);

        if (!data.room || !data.room.id) {
          console.error("Invalid room data received:", data);
          return;
        }

        setState((prevState) => {
          console.log("Updating state with joined room:", data.room);

          const updatedRooms = [...prevState.rooms];
          const existingRoomIndex = updatedRooms.findIndex(
            (r) => r.id === data.room.id
          );

          if (existingRoomIndex >= 0) {
            // Update existing room
            updatedRooms[existingRoomIndex] = data.room;
          } else {
            // Add new room
            updatedRooms.push(data.room);
          }

          return {
            ...prevState,
            rooms: updatedRooms,
            selectedRoom: data.room,
          };
        });

        // Fetch messages for the room
        socketService.getRoomMessages(data.room.id);
      });

      socketService.on("leftRoom", (data: { roomId: string }) => {
        console.log("Left room:", data.roomId);
        setState((prevState) => {
          const updatedRooms = prevState.rooms.filter(
            (r) => r.id !== data.roomId
          );
          return {
            ...prevState,
            rooms: updatedRooms,
            selectedRoom:
              prevState.selectedRoom?.id === data.roomId
                ? null
                : prevState.selectedRoom,
            messages:
              prevState.selectedRoom?.id === data.roomId
                ? []
                : prevState.messages,
          };
        });
      });

      // Message related event listeners
      socketService.on(
        "roomMessages",
        (data: { roomId: string; messages: Message[] }) => {
          console.log(
            `Received ${data.messages.length} messages for room ${data.roomId}`
          );
          setState((prevState) => {
            if (prevState.selectedRoom?.id === data.roomId) {
              console.log("Updating messages state with received messages");
              return {
                ...prevState,
                messages: data.messages,
              };
            }
            return prevState;
          });
        }
      );

      socketService.on(
        "newRoomMessage",
        (data: { roomId: string; message: Message }) => {
          console.log(`New message in room ${data.roomId}:`, data.message);
          setState((prevState) => {
            if (prevState.selectedRoom?.id === data.roomId) {
              console.log("Adding new message to state");
              return {
                ...prevState,
                messages: [...prevState.messages, data.message],
              };
            }
            return prevState;
          });
        }
      );

      // Request initial rooms list
      console.log("Requesting rooms list");
      socketService.getRooms();

      return true;
    } catch (error) {
      console.error("Failed to connect socket:", error);
      setState((prevState) => ({
        ...prevState,
        error: "Não foi possível conectar ao servidor de chat",
      }));
      return false;
    }
  };

  // Fetch user rooms
  const fetchUserRooms = async (userId: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true }));
      const user = await api.getUserById(userId);

      // If the user object contains rooms property
      if (user && Array.isArray(user.rooms)) {
        setState((prevState) => ({
          ...prevState,
          rooms: user.rooms,
          loading: false,
        }));
      } else {
        // Otherwise, we need to fetch rooms separately
        socketService.getRooms();
        setState((prevState) => ({ ...prevState, loading: false }));
      }
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      setState((prevState) => ({
        ...prevState,
        error: "Failed to load user rooms",
        loading: false,
      }));
    }
  };

  // Register new user
  const register = async (login: string, password: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true }));

      // Call register API
      const registerResponse = await api.createUser(login, password);

      if (!registerResponse || !registerResponse.access_token) {
        throw new Error("Invalid response from registration server");
      }

      // With register, we get the token but might need to fetch user info
      const { access_token } = registerResponse;

      // Store token
      localStorage.setItem("token", access_token);

      // Fetch user info
      const userResponse = await api.getUserById(registerResponse.user?.id);

      if (!userResponse || !userResponse.id) {
        throw new Error("Failed to get user data after registration");
      }

      // Store user ID
      localStorage.setItem("userId", userResponse.id);

      console.log("Registration successful:", {
        userId: userResponse.id,
        login: userResponse.login,
        token: access_token ? "Present (not shown)" : "Missing",
      });

      setState((prevState) => ({
        ...prevState,
        currentUser: userResponse,
        loading: false,
        error: null, // Clear any previous errors
      }));

      // Connect to WebSocket
      await connectSocket(userResponse.id);
    } catch (error: any) {
      console.error("Erro ao registrar:", error);

      // Clear any stored authentication data
      localStorage.removeItem("userId");
      localStorage.removeItem("token");

      setState((prevState) => ({
        ...prevState,
        currentUser: null,
        error:
          error.response?.data?.message ||
          "Erro ao registrar. Por favor, tente novamente.",
        loading: false,
      }));
      throw error;
    }
  };

  // Login user
  const login = async (login: string, password: string) => {
    try {
      setState((prevState) => ({ ...prevState, loading: true }));

      // Call login API
      const authResponse = await api.loginUser(login, password);

      // Extract user and token from response
      if (!authResponse || !authResponse.user || !authResponse.access_token) {
        throw new Error("Invalid response from authentication server");
      }

      const { user, access_token } = authResponse;

      // Save authentication data
      localStorage.setItem("userId", user.id);
      localStorage.setItem("token", access_token);

      console.log("Login successful:", {
        userId: user.id,
        login: user.login,
        token: access_token ? "Present (not shown)" : "Missing",
      });

      setState((prevState) => ({
        ...prevState,
        currentUser: user,
        loading: false,
        error: null, // Clear any previous errors
      }));

      // Connect to WebSocket with improved handling
      const socketConnected = await connectSocket(user.id);
      if (!socketConnected) {
        console.warn("Socket connection failed, but login was successful");
        // Could show a warning to the user
      }

      // Fetch rooms regardless of socket connection
      fetchUserRooms(user.id);
    } catch (error: any) {
      console.error("Login error:", error);

      // Clear any stored authentication data
      localStorage.removeItem("userId");
      localStorage.removeItem("token");

      setState((prevState) => ({
        ...prevState,
        currentUser: null,
        error:
          error.response?.data?.message ||
          "Login failed. Please check your credentials.",
        loading: false,
      }));
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token"); // Remove token on logout
    socketService.disconnect();
    setState(initialState);
  };

  // Create a new room
  const createRoom = async (name: string) => {
    if (!state.currentUser) return;

    try {
      setState((prevState) => ({ ...prevState, loading: true }));
      const room = await api.createRoom(name, state.currentUser.id);
      setState((prevState) => ({
        ...prevState,
        rooms: [...prevState.rooms, room],
        loading: false,
      }));
      selectRoom(room);
      await enterRoom(room.id);
    } catch (error: any) {
      console.error("Create room error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to create room",
        loading: false,
      }));
    }
  };

  // Enter a room
  const enterRoom = async (roomId: string) => {
    if (!state.currentUser) return;

    try {
      setState((prevState) => ({ ...prevState, loading: true }));
      await api.enterRoom(roomId, state.currentUser.id);
      socketService.joinRoom(roomId);
      setState((prevState) => ({ ...prevState, loading: false }));
    } catch (error: any) {
      console.error("Enter room error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to enter room",
        loading: false,
      }));
    }
  };

  // Leave a room
  const leaveRoom = async (roomId: string) => {
    if (!state.currentUser) return;

    try {
      setState((prevState) => ({ ...prevState, loading: true }));
      await api.leaveRoom(roomId, state.currentUser.id);
      socketService.leaveRoom(roomId);

      setState((prevState) => {
        const updatedRooms = prevState.rooms.filter((r) => r.id !== roomId);
        return {
          ...prevState,
          rooms: updatedRooms,
          selectedRoom:
            prevState.selectedRoom?.id === roomId
              ? null
              : prevState.selectedRoom,
          messages:
            prevState.selectedRoom?.id === roomId ? [] : prevState.messages,
          loading: false,
        };
      });
    } catch (error: any) {
      console.error("Leave room error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to leave room",
        loading: false,
      }));
    }
  };

  // Send a message to the selected room
  const sendMessage = async (content: string) => {
    if (!state.currentUser || !state.selectedRoom) return;

    try {
      console.log(
        `Sending message to room ${state.selectedRoom.id}: "${content}"`
      );

      // Use only the socket for sending messages to prevent duplication
      socketService.sendRoomMessage(state.selectedRoom.id, content);

      // Remove the API call to prevent message duplication
      // await api.sendRoomMessage(
      //   state.selectedRoom.id,
      //   state.currentUser.id,
      //   content
      // );
    } catch (error: any) {
      console.error("Send message error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to send message",
      }));
    }
  };

  // Send a direct message to the selected user
  const sendDirectMessage = async (content: string) => {
    if (!state.currentUser || !state.selectedUser) return;

    try {
      console.log(
        `Sending direct message to user ${state.selectedUser.id}: "${content}"`
      );

      // Send via socket
      socketService.sendDirectMessage(state.selectedUser.id, content);

      // No need to manually add the message here since we'll receive it back via socket event
      // The optimistic UI update is handled in the DirectChat component
    } catch (error: any) {
      console.error("Send direct message error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to send direct message",
      }));
    }
  };

  // Select a room
  const selectRoom = (room: Room | null) => {
    setState((prevState) => ({
      ...prevState,
      selectedRoom: room,
      selectedUser: null,
      activeTab: "rooms",
      messages: [], // Clear messages when changing rooms
    }));

    if (room) {
      socketService.getRoomMessages(room.id);
    }
  };

  // Select a user for direct messaging
  const selectUser = (user: User | null) => {
    // Se o mesmo usuário já estiver selecionado, não faz nada para evitar loop
    if (state.selectedUser?.id === user?.id && state.activeTab === "direct") {
      return;
    }

    setState((prevState) => ({
      ...prevState,
      selectedUser: user,
      selectedRoom: null,
      activeTab: "direct",
      messages: [], // Clear messages when changing users
    }));

    if (user) {
      socketService.getDirectMessages(user.id);
    }
  };

  // Set active tab (rooms or direct messages)
  const setActiveTab = (tab: "rooms" | "direct") => {
    setState((prevState) => ({
      ...prevState,
      activeTab: tab,
    }));
  };

  // Get all users
  const getAllUsers = async () => {
    try {
      setState((prevState) => ({ ...prevState, loading: true }));
      const users = await api.getAllUsers();

      setState((prevState) => ({
        ...prevState,
        users,
        loading: false,
      }));
    } catch (error: any) {
      console.error("Get all users error:", error);
      setState((prevState) => ({
        ...prevState,
        error: error.response?.data?.message || "Failed to get users list",
        loading: false,
      }));
    }
  };

  // Set error message
  const setError = (error: string | null) => {
    setState((prevState) => ({ ...prevState, error }));
  };

  // Reconnect WebSocket
  const reconnectSocket = async () => {
    if (!state.currentUser) return;

    try {
      await connectSocket(state.currentUser.id);
      if (state.selectedRoom) {
        socketService.joinRoom(state.selectedRoom.id);
        socketService.getRoomMessages(state.selectedRoom.id);
      }
    } catch (error) {
      console.error("Reconnect socket error:", error);
    }
  };

  // Get direct message previews for WhatsApp-like UI
  const getDirectMessagesPreviews = async (): Promise<UserChatPreview[]> => {
    if (!state.currentUser) return [];

    try {
      // Don't set loading state here to avoid unnecessary re-renders

      // Get users if needed, but don't set state
      let usersList = [...state.users];
      if (usersList.length === 0) {
        try {
          const usersResponse = await api.getAllUsers();
          usersList = usersResponse;
        } catch (error) {
          console.error("Error fetching users for previews:", error);
        }
      }

      // Get recent chats from local storage or cache if possible
      const cachedPreviewsJson = localStorage.getItem("chatPreviews");
      let cachedPreviews: UserChatPreview[] = [];

      if (cachedPreviewsJson) {
        try {
          cachedPreviews = JSON.parse(cachedPreviewsJson);
        } catch (error) {
          console.error("Error parsing cached previews:", error);
        }
      }

      // If we have cached previews and they're not too old, use them first
      if (cachedPreviews.length > 0) {
        const cacheTime = localStorage.getItem("chatPreviewsTime");
        const now = Date.now();

        // Use cache if it's less than 1 minute old
        if (cacheTime && now - parseInt(cacheTime) < 60000) {
          return cachedPreviews;
        }
      }

      // Get all direct messages in one batch if possible
      let allMessages: Message[] = [];
      try {
        // If the API supports getting all direct messages at once
        // allMessages = await api.getAllDirectMessages();

        // For now, we'll use a more efficient approach by prioritizing visible chats
        const chatUsers = usersList.filter(
          (user) => user.id !== state.currentUser?.id
        );

        // First try to get messages for the selected user
        if (state.selectedUser) {
          try {
            const selectedUserMessages = await api.getDirectMessages(
              state.selectedUser.id
            );
            allMessages = [...allMessages, ...selectedUserMessages];
          } catch (error) {
            console.error(`Error fetching messages with selected user:`, error);
          }
        }

        // Then get the messages for the most recent cached chats
        const priorityUserIds = cachedPreviews
          .slice(0, 5) // Only get the 5 most recent chats
          .map((preview) => preview.user.id)
          .filter((id) => id !== state.selectedUser?.id); // Skip the selected user

        for (const userId of priorityUserIds) {
          try {
            const messages = await api.getDirectMessages(userId);
            allMessages = [...allMessages, ...messages];
          } catch (error) {
            console.error(`Error fetching messages for user ${userId}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching all direct messages:", error);
      }

      // Group messages by user
      const messagesByUser: Record<string, Message[]> = {};

      allMessages.forEach((message) => {
        const otherUserId =
          message.senderId === state.currentUser?.id
            ? message.receiverId
            : message.senderId;

        if (!otherUserId) return;

        if (!messagesByUser[otherUserId]) {
          messagesByUser[otherUserId] = [];
        }

        messagesByUser[otherUserId].push(message);
      });

      // Create previews for each user
      const previews: UserChatPreview[] = [];

      // First add users with messages
      Object.entries(messagesByUser).forEach(([userId, messages]) => {
        const user = usersList.find((u) => u.id === userId);

        if (!user) return;

        // Sort messages by date (newest first)
        const sortedMessages = [...messages].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Get the last message
        const lastMessage = sortedMessages[0];

        // Count unread messages
        const unreadCount = sortedMessages.filter(
          (msg) => msg.senderId === user.id && !msg.readAt
        ).length;

        previews.push({
          user,
          lastMessage,
          unreadCount,
        });
      });

      // Add selected user if not already in the list
      if (
        state.selectedUser &&
        !previews.some((p) => p.user.id === state.selectedUser?.id)
      ) {
        previews.unshift({
          user: state.selectedUser,
          lastMessage: null,
          unreadCount: 0,
        });
      }

      // Sort by date of last message (newest first)
      previews.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      });

      // Cache the results
      try {
        localStorage.setItem("chatPreviews", JSON.stringify(previews));
        localStorage.setItem("chatPreviewsTime", Date.now().toString());
      } catch (error) {
        console.error("Error caching previews:", error);
      }

      return previews;
    } catch (error: any) {
      console.error("Get direct message previews error:", error);
      return [];
    }
  };

  // Context value
  const contextValue: ChatContextProps = {
    state,
    login,
    logout,
    register,
    createRoom,
    enterRoom,
    leaveRoom,
    sendMessage,
    sendDirectMessage,
    selectRoom,
    selectUser,
    setActiveTab,
    setError,
    getAllUsers,
    reconnectSocket,
    getDirectMessagesPreviews,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
