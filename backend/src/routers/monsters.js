import { Router } from "express";

const router = Router();

router
    .post("/", (req, res) => {
        res.status(201).json({
            "message": "created",
            "data": {
                "name": "Flametail",
                "hp": 100,
                "attack": 20,
                "defense": 10,
                "speed": 15,
                "special": "fireblast"
            }
        })
    })
    .get('/', (req, res) => {

        res.status(200).json([
            {
                "name": "Flametail",
                "hp": 100,
                "attack": 20,
                "defense": 10,
                "speed": 15,
                "special": "fireblast"
            },
            {
                "name": "Flametail",
                "hp": 100,
                "attack": 20,
                "defense": 10,
                "speed": 15,
                "special": "fireblast"
            }
        ])
    })

export default router

