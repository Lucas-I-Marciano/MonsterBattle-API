import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cors = require("cors");

import routers from "./routers/index.js";

const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const port = 3000;

let roomInfo = {};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("userJoinRoom", (data) => {
    console.log("userJoinRoom");

    roomInfo = { ...roomInfo, ...data };

    io.emit("roomInfo", roomInfo);
  });

  socket.on("disconnect", () => {
    console.log("Desconetar o socket ", socket.id);
    delete roomInfo[socket.id];
    io.emit("roomInfo", roomInfo);
    io.emit("userDisconnected", socket.id);
  });
});

app.use(cors());
app.use(express.json());
routers(app);

server.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
