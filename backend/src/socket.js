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
const turns = {};
let turn = 0;
const aux_turn = {};

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

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

  socket.on("userAction", (data) => {
    if (!turns[turn]) {
      turns[turn] = {
        [data.socketId]: {
          action: data.action,
          name: data.name,
          attack: data.attack,
          defense: data.defense,
          hp: data.hp,
          speed: data.speed,
        },
      };
    } else if (!turns[turn][data.socketId]) {
      turns[turn][data.socketId] = {
        action: data.action,
        name: data.name,
        attack: data.attack,
        defense: data.defense,
        hp: data.hp,
        speed: data.speed,
      };

      const thisSocketAction = data.action;
      const otherSocketId = Object.keys(turns[turn]).filter((id) => {
        return id !== data.socketId;
      });
      const otherSocketObject = turns[turn][otherSocketId];
      const otherSocketAction = otherSocketObject.action;

      if (thisSocketAction === "attack") {
        switch (otherSocketAction) {
          case "attack":
            // thisHp_aa -> a of "A"ttacks
            const thisHp_aa =
              data.hp -
              (otherSocketObject.attack - data.defense > 0
                ? otherSocketObject.attack - data.defense
                : 0);
            const otherHp_aa =
              otherSocketObject.hp -
              (data.attack - otherSocketObject.defense > 0
                ? data.attack - otherSocketObject.defense
                : 0);
            turns[turn][data.socketId].hp = thisHp_aa;
            turns[turn][otherSocketId].hp = otherHp_aa;

            break;
          case "defend":
            const thisHp =
              data.hp -
              (otherSocketObject.defense * 1.5 - data.attack > 0
                ? otherSocketObject.defense * 1.5 - data.attack
                : 0);

            const otherHp =
              otherSocketObject.hp -
              (data.attack - otherSocketObject.defense * 1.5 > 0
                ? data.attack - otherSocketObject.defense * 1.5
                : 0);
            turns[turn][data.socketId].hp = thisHp;
            turns[turn][otherSocketId].hp = otherHp;

          default:
            break;
        }
      } else if (thisSocketAction === "defend") {
        switch (otherSocketAction) {
          case "attack":
            // thisHp_aa -> a of "A"ttacks
            const thisHp =
              data.hp -
              (otherSocketObject.attack - data.defense * 1.5 > 0
                ? otherSocketObject.attack - data.defense * 1.5
                : 0);
            const otherHp =
              otherSocketObject.hp -
              (data.defense * 1.5 - otherSocketObject.attack > 0
                ? data.defense * 1.5 - otherSocketObject.attack
                : 0);
            turns[turn][data.socketId].hp = thisHp;
            turns[turn][otherSocketId].hp = otherHp;

            break;
          case "defend":
            // thisHp_dd -> d of "D"effends
            const thisHp_dd = data.hp;

            const otherHp_dd = otherSocketObject.hp;
            turns[turn][data.socketId].hp = thisHp_dd;
            turns[turn][otherSocketId].hp = otherHp_dd;

          default:
            break;
        }
      }

      io.emit("turnFinished", turns);
    } else {
      turn += 1;
      turns[turn] = {
        [data.socketId]: {
          action: data.action,
          name: data.name,
          attack: data.attack,
          defense: data.defense,
          hp: data.hp,
          speed: data.speed,
        },
      };
    }
  });
});

app.use(cors());
app.use(express.json());
routers(app);

server.listen(port, async () => {
  console.log(`Server listening on port: ${port}`);
  try {
    await prisma.player.deleteMany({});
  } catch (error) {}
});
