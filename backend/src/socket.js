import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const cors = require("cors");
const prisma = new PrismaClient();

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
    roomInfo = { ...roomInfo, ...data };
  });

  socket.on("userOnRoom", () => {
    io.emit("roomInfo", roomInfo);
  });

  socket.on("disconnect", async () => {
    try {
      await prisma.player.deleteMany({
        where: {
          socket: socket.id.toString(),
        },
      });
    } catch (error) {
      console.log("Error");
    }
    delete roomInfo[socket.id];
    io.emit("roomInfo", roomInfo);
  });
});

app.use(cors());
app.use(express.json());
routers(app);

server.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
