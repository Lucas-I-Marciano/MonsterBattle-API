import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router
  .post("/", async (req, res) => {
    const { name, socket } = req.body;
    try {
      const user = await prisma.player.findUnique({
        where: {
          name,
        },
      });
      if (user) {
        return res
          .status(400)
          .json({ message: "fail", detail: "Name already in use" });
      }
      const result = await prisma.player.create({
        data: {
          name,
          socket,
        },
      });
      res.header("userId", result["id"]);

      res.status(201).json({ message: "created", data: result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "fail", detail: "Internal Server Error" });
    }
  })
  .delete("/socket/:socket", async (req, res) => {
    const { socket } = req.params;

    try {
      const user = await prisma.player.findMany({
        where: {
          socket,
        },
      });

      if (user.length == 0) {
        return res.status(404).json({
          message: "fail",
          detail: "User not found",
        });
      }

      await prisma.player.deleteMany({
        where: {
          socket,
        },
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({
        message: "fail",
        detail: "Internal Server Error",
      });
    }
  })
  .delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.player.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!user) {
        return res
          .status(404)
          .json({ message: "fail", detail: "User not founded" });
      }

      await prisma.player.delete({
        where: {
          id: parseInt(id),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "fail", detail: "Internal Server Error" });
    }

    res.status(204).json();
  });

export default router;
