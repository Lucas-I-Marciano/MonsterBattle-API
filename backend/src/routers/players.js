import { Router } from "express";
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

router
    .post("/", async (req, res) => {
        const {name} = req.body
        try {
            const user = await prisma.player.findUnique({
                where: {
                    name
                }
            })
            if (user) {
                return res.status(400).json({"message":"fail", "detail":"Name already in use"})
            }
            const result = await prisma.player.create({
                data: {
                    name
                }
            })
            res.status(201).json({ "message": "created", "data": result })
        } catch (error) {
            res.status(500).json({"message":"fail", "detail":"Internal Server Error"})
        }
    })
    .delete('/:id', async (req, res) => {
        const { id } = req.params
        await prisma.player.delete({
            where: {
                "id" : parseInt(id)
            }
        })

        res.status(204).json()
    })

export default router

