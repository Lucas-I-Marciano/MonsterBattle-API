import { Routes, Route } from "react-router";
import { Battle } from "./pages/Battle";
import { Home } from "./pages/Home";
import { socket } from "./socket";
import { useEffect } from "react";
import { joinArena } from "./services/arena";
import { randomMonster } from "./services/monster";

function App() {
  useEffect(() => {
    const result = async () => {
      const response = await joinArena(5, 3);
      const monster = await randomMonster(response["monster_id"]);
      const socketId = socket.id.toString();

      socket.emit("userJoinRoom", { [socketId]: { monster } });
    };

    socket.on("userDisconnected", (data) => {
      console.log("userDisconnected");
    });

    result();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </>
  );
}
export default App;
