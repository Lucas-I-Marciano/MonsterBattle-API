import { Router } from "express";

const router = Router();

router
    .post("/", (req, res) => {
        res.status(201).json({ "message": "created", "data": "data" })
    })
    .delete('/:id', (req, res) => {
        const { id } = req.params
        console.log(id);

        res.status(204).json()
    })

export default router

