import { Router } from "express";
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

router
    .post("/", async (req, res) => {
        const { name, hp, attack, defense, speed, special } = req.body
        const createObject = { name, hp, attack, defense, speed, special }
        const haveNullValue = Object.entries(createObject).filter((info)=>{return Boolean(!info[1])})
        
        if (haveNullValue.length > 0) {
            return res.status(400).json({"message":"fail", "detail":"All fields are required - name, hp, attack, defense, speed, special"})
        }

        try {
            const monster = await prisma.monster.findUnique({
                where: {
                    name
                }
            })
            if (monster) {
                return res.status(400).json({"message":"fail", "detail":"Monster already exists"})
            }

            const result = await prisma.monster.create({
                data: createObject
            })
            res.status(201).json({
                "message": "created",
                "data": result
            })
        } catch (error) {
            res.status(500).json({"message":"fail", "detail":"Internal Server Error"})
        }
    })
    .get('/', async (req, res) => {

        try {
            const monsters = await prisma.monster.findMany()
            res.status(200).json(monsters)
        } catch (error) {
            res.status(500).json({"message":"fail", "detail":"Internal Server Error"})
        }
    })

export default router

