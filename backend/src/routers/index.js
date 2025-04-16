import playersRoute from "./players.js"
import monstersRoute from "./monsters.js"
import arenasRoute from "./arenas.js"

const routers = (app) => {
    app.use("/players", playersRoute)
    app.use("/monsters", monstersRoute)
    app.use("/arenas", arenasRoute)
}

export default routers