// Mock para socket.io-client
export const io = () => {
  console.warn("socket.io-client mock being used");
  return {
    on: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {},
  };
};
