import express from "express"
import { createServer } from "http"
import { dirname, resolve } from "path"
import { Server } from "socket.io"
import { fileURLToPath } from "url"


const app = express()
const server = createServer(app)
export const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
})

const port = 3000

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("testEvent", () => {
        console.log("testEvent");
    })

})

server.listen(port, () => {
    console.log(`Server listening on port: ${port}`);

})

