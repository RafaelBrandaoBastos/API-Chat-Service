// APIs legadas
export const FowardingTunnelUserApiEndpoint =
  "https://cf2d-2804-14c-5ba4-958e-ccf4-944b-5e3c-a36d.ngrok-free.app";

export const FowardingTunnelChatEndpoint =
  "https://cf2d-2804-14c-5ba4-958e-ccf4-944b-5e3c-a36d.ngrok-free.app";

export const LocalUserEndpoint = "http://localhost:8080";

export const LocalChatEndpoint = "http://localhost:8081";

// NestJS API endpoints - adaptado para formato atual da API
export const NestJSApiEndpoint =
  process.env.REACT_APP_API_URL || "http://localhost:3000";
export const NestJSWsEndpoint =
  process.env.REACT_APP_WS_URL || "ws://localhost:3000/chat";
export const NestJSAuthEndpoint = `${NestJSApiEndpoint}/auth`;
export const NestJSUsersEndpoint = `${NestJSApiEndpoint}/users`;
export const NestJSRoomsEndpoint = `${NestJSApiEndpoint}/rooms`;
export const NestJSMessagesEndpoint = `${NestJSApiEndpoint}/messages`;
