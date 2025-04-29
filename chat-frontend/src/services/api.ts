import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API calls
export const createUser = async (login: string, password: string) => {
  try {
    const response = await api.post("/auth/register", { login, password });
    return response.data;
  } catch (error) {
    console.error("API createUser error:", error);
    throw error;
  }
};

export const loginUser = async (login: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { login, password });
    return response.data;
  } catch (error) {
    console.error("API loginUser error:", error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Room API calls
export const getRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

export const createRoom = async (name: string, creatorId: string) => {
  const response = await api.post("/rooms", { name, creatorId });
  return response.data;
};

export const enterRoom = async (roomId: string, userId: string) => {
  const response = await api.post(`/rooms/${roomId}/enter`, { userId });
  return response.data;
};

export const leaveRoom = async (roomId: string, userId: string) => {
  const response = await api.post(`/rooms/${roomId}/leave`, { userId });
  return response.data;
};

export const deleteRoom = async (roomId: string) => {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
};

export const removeUserFromRoom = async (roomId: string, userId: string) => {
  const response = await api.delete(`/rooms/${roomId}/users/${userId}`);
  return response.data;
};

// Message API calls
export const sendDirectMessage = async (
  receiverId: string,
  senderId: string,
  content: string
) => {
  const response = await api.post(`/messages/direct/${receiverId}`, {
    senderId,
    content,
  });
  return response.data;
};

export const getDirectMessages = async (userId: string) => {
  const response = await api.get(`/messages/direct/${userId}`);
  return response.data;
};

export const sendRoomMessage = async (
  roomId: string,
  senderId: string,
  content: string
) => {
  const response = await api.post(`/rooms/${roomId}/messages`, {
    senderId,
    content,
  });
  return response.data;
};

export const getRoomMessages = async (roomId: string) => {
  const response = await api.get(`/rooms/${roomId}/messages`);
  return response.data;
};

export default api;
