"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ["https://dev.admin.granconecta.net.br", "https://dev.granconecta.net.br"],
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        console.log("Cliente conectado:", socket.id);
        socket.on("join_order", (orderId) => {
            socket.join(`order_${orderId}`);
        });
        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket não inicializado");
    return io;
};
exports.getIO = getIO;
