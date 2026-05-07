import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["https://dev.admin.granconecta.net.br", "https://dev.granconecta.net.br"],
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("join_order", (orderId: string) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket não inicializado");
  return io;
};