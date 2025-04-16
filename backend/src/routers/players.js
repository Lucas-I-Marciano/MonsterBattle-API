import { Router } from "express";
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

router
    .post("/", async (req, res) => {
        const {name} = req.body
        const result = await prisma.player.create({
            data: {
                name
            }
        })
        res.status(201).json({ "message": "created", "data": result })
    })
    .delete('/:id', (req, res) => {
        const { id } = req.params
        console.log(id);

        res.status(204).json()
    })

export default router

