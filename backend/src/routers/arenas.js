import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router
  .post("/", async (req, res) => {
    const { name, max_players } = req.body;

    const createObject = { name, max_players };
    const haveNullValue = Object.entries(createObject).filter((info) => {
      return Boolean(!info[1]);
    });

    if (haveNullValue.length > 0) {
      return res.status(400).json({
        message: "fail",
        detail: "All fields are required - name, max_players",
      });
    }

    try {
      const arena = await prisma.arena.findUnique({
        where: {
          name,
        },
      });
      if (arena) {
        return res
          .status(400)
          .json({ message: "fail", detail: "Arena already created" });
      }
      const result = await prisma.arena.create({
        data: createObject,
      });
      res.status(201).json({ message: "created", data: result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "fail", detail: "Internal Server Error" });
    }
  })
  .post("/:id/join", async (req, res) => {
    const { id: arenaId } = req.params;

    const userId = req.get("userid");
    if (!userId) {
      return res.status(400).json({
        message: "fail",
        detail: "Please choose a name before join any arena",
      });
    }
    try {
      const user = await prisma.player.findUnique({
        where: {
          id: parseInt(userId),
        },
      });
      if (!user) {
        return res
          .status(401)
          .json({ message: "fail", detail: "User not founded" });
      }

      const monstersIds = await prisma.monster.findMany({
        distinct: ["id"],
        select: {
          id: true,
        },
      });

      const randomMonsterId =
        monstersIds[Math.trunc(Math.random() * monstersIds.length)]["id"];
      const randomMonster = await prisma.monster.findUnique({
        where: {
          id: randomMonsterId,
        },
      });

      res.header("arenaId", parseInt(arenaId));

      res.status(200).json({
        player_id: parseInt(userId),
        monster_id: randomMonster["id"],
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "fail", detail: "Internal Server Error" });
    }
  })
  .post("/:id/leave", (req, res) => {
    res.status(204).json();
  })
  .post("/:id/start", (req, res) => {
    res.status(200).json({
      message: "Battle started",
      turn: 1,
      battle_state: {
        player_1: {
          monster: "Flametail",
          hp: 100,
        },
        player_2: {
          monster: "Aquabeast",
          hp: 100,
        },
      },
    });
  })
  .post("/:id/action", (req, res) => {
    res.status(200).json({
      player_id: 1,
      action: "attack",
    });
  })
  .post("/:id/end", (req, res) => {
    res.status(200).json({
      winner: {
        player_id: 2,
        monster: "Aquabeast",
      },
    });
  });

export default router;
