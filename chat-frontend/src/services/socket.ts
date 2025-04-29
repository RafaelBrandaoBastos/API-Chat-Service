import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_WS_URL || "http://localhost:3000/chat";

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;

        // Disconnect existing socket if any
        if (this.socket) {
          this.socket.disconnect();
        }

        // Get JWT token from localStorage
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No auth token found in localStorage");
          reject(new Error("No authentication token available"));
          return;
        }

        console.log("Connecting to WebSocket with token...");

        // Connect to WebSocket server with token
        this.socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
          auth: {
            token: `Bearer ${token}`,
            userId: userId,
          },
        });

        this.socket.on("connect", () => {
          console.log(
            "WebSocket connected successfully with ID:",
            this.socket?.id
          );
          this.registerUser(userId);
          resolve(this.socket as Socket);
        });

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          reject(error);
        });

        this.socket.on("error", (error) => {
          console.error("WebSocket error received:", error);
        });

        this.socket.on("disconnect", (reason) => {
          console.log("WebSocket disconnected:", reason);
        });

        // Add debug event for authentication success
        this.socket.on("authenticated", (data) => {
          console.log("Socket authentication success:", data);
        });
      } catch (error) {
        console.error("Error initializing socket connection:", error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  registerUser(userId: string): void {
    if (this.socket) {
      console.log(`Registering user ${userId} with socket ${this.socket.id}`);
      this.socket.emit("registerUser", { userId });
    }
  }

  // Room related events
  joinRoom(roomId: string): void {
    if (this.socket && this.userId) {
      this.socket.emit("joinRoom", { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.userId) {
      this.socket.emit("leaveRoom", { roomId });
    }
  }

  getRooms(): void {
    if (this.socket) {
      this.socket.emit("getRooms");
    }
  }

  // Message related events
  sendRoomMessage(roomId: string, content: string): void {
    if (this.socket && this.userId) {
      console.log(`Sending message to room ${roomId}: "${content}"`);
      this.socket.emit("sendRoomMessage", { roomId, content });
    }
  }

  sendDirectMessage(receiverId: string, content: string): void {
    if (this.socket && this.userId) {
      console.log(`Sending direct message to ${receiverId}: "${content}"`);
      this.socket.emit("sendDirectMessage", { receiverId, content });
    }
  }

  getDirectMessages(otherUserId: string): void {
    if (this.socket) {
      console.log(`Requesting direct messages with user ${otherUserId}`);
      this.socket.emit("getDirectMessages", { otherUserId });
    }
  }

  getRoomMessages(roomId: string): void {
    if (this.socket) {
      console.log(`Requesting messages for room ${roomId}`);
      this.socket.emit("getRoomMessages", { roomId });
    }
  }

  // Typing events
  typing(roomId?: string, receiverId?: string): void {
    if (this.socket) {
      this.socket.emit("typing", { roomId, receiverId });
    }
  }

  // Add event listener
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Test ping event
  ping(): void {
    if (this.socket) {
      this.socket.emit("ping", { timestamp: new Date().toISOString() });
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
