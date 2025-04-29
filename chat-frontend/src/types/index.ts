export interface User {
  id: string;
  login: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  users?: User[];
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  roomId?: string;
  sender?: User;
  createdAt: string;
  updatedAt?: string;
  readAt?: string;
  type?: "room" | "direct";
}

export interface LoginFormData {
  login: string;
  password: string;
}

export interface RegisterFormData {
  login: string;
  password: string;
  confirmPassword: string;
}

export interface ChatState {
  currentUser: User | null;
  rooms: Room[];
  selectedRoom: Room | null;
  selectedUser: User | null;
  messages: Message[];
  users: User[];
  loading: boolean;
  error: string | null;
  activeTab: "rooms" | "direct";
}

export interface CreateRoomData {
  name: string;
  creatorId: string;
}
