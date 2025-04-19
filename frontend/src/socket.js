// Em ../socket.js (frontend)

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000"; // <-- CONFIRME ESTA URL!
export const socket = io(SOCKET_URL); // autoConnect é true por padrão

// Adicione estes listeners para depuração
socket.on("connect", () => {
  console.log("FRONTEND: Socket Conectado! ID:", socket.id);
  // Você pode usar este evento para atualizar um estado global/contexto
  // e informar a aplicação que a conexão está ativa.
});

socket.on("disconnect", (reason) => {
  console.log("FRONTEND: Socket Desconectado:", reason);
  // Atualizar estado para indicar desconexão
});

socket.on("connect_error", (err) => {
  // Isso é MUITO útil para diagnosticar problemas
  console.error(
    "FRONTEND: Erro de conexão Socket:",
    err.message,
    err.data || ""
  );
});
