import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const cors = require("cors");
const prisma = new PrismaClient();

import routers from "./routers/index.js";
import { calculateDamage, calculateDefenseAbsorption } from "./utils/damage.js";

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

      let updatedThisHp = data.hp;
      let updatedOtherHp = otherSocketObject.hp;

      if (thisSocketAction === "attack") {
        switch (otherSocketAction) {
          case "attack":
            updatedThisHp = calculateDamage(otherSocketObject, data);
            updatedOtherHp = calculateDamage(data, otherSocketObject);
            break;
          case "defend":
            updatedThisHp = calculateDefenseAbsorption(
              otherSocketObject,
              data,
              1.5
            );
            updatedOtherHp = calculateDamage(data, {
              ...otherSocketObject,
              defense: otherSocketObject.defense * 1.5,
            });
          default:
            break;
        }
      } else if (thisSocketAction === "defend") {
        switch (otherSocketAction) {
          case "attack":
            updatedThisHp = calculateDamage(otherSocketObject, {
              ...data,
              defense: data.defense * 1.5,
            });
            updatedOtherHp = calculateDefenseAbsorption(
              data,
              otherSocketObject,
              1.5
            );
            break;
          case "defend":
            updatedThisHp = data.hp;
            updatedOtherHp = otherSocketObject.hp;

          default:
            break;
        }
      }
      turns[turn][data.socketId].hp = updatedThisHp;
      turns[turn][otherSocketId].hp = updatedOtherHp;

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
