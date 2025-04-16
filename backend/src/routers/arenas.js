import { Router } from "express";

const router = Router();

router
    .post("/", (req, res) => {
        res.status(201).json({
            "message": "created",
            "data": {
                "name": "Volcano Pit",
                "max_players": 2
            }
        })
    })
    .post('/:id/join', (req, res) => {

        res.status(200).json({
            "player_id": 1,
            "monster_id": 3
        })
    })
    .post('/:id/leave', (req, res) => {
        res.status(204).json()
    })
    .post('/:id/start', (req, res) => {

        res.status(200).json({
            "message": "Battle started",
            "turn": 1,
            "battle_state": {
                "player_1": {
                    "monster": "Flametail",
                    "hp": 100
                },
                "player_2": {
                    "monster": "Aquabeast",
                    "hp": 100
                }
            }
        })
    })
    .post('/:id/action', (req, res) => {
        res.status(200).json({
            "player_id": 1,
            "action": "attack"
        })
    })
    .post('/:id/end', (req, res) => {
        res.status(200).json({
            "winner": {
                "player_id": 2,
                "monster": "Aquabeast"
            }
        })
    })

export default router

