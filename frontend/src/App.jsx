import { useEffect, useState } from "react";
import { socket } from "./socket";

import { CardOne } from "./components/CardOne";
import { CardTwo } from "./components/CardTwo";

import { joinArena } from "./services/arena";
import { randomMonster } from "./services/monster";

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [monsterOne, setMonsterOne] = useState({
    name: "",
    hp: "",
    attack: "",
    defense: "",
    speed: "",
  });
  const [monsterTwo, setMonsterTwo] = useState({
    name: "",
    hp: "",
    attack: "",
    defense: "",
    speed: "",
  });

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    const result = async () => {
      const response = await joinArena(5, 3);
      const monster = await randomMonster(response["monster_id"]);
      setMonsterOne(monster);

      const response_ = await joinArena(5, 3);
      const monster_ = await randomMonster(response_["monster_id"]);
      setMonsterTwo(monster_);
    };
    result();
  }, []);
  return (
    <>
      <div className="App flex flex-col"></div>
      <button
        onClick={() => {
          socket.emit("testEvent");
        }}
      >
        testEvent
      </button>
      <div className="flex">
        <CardOne
          name={monsterOne.name}
          hp={monsterOne.hp}
          attack={monsterOne.attack}
          defense={monsterOne.defense}
          speed={monsterOne.speed}
        />
        <CardTwo
          name={monsterTwo.name}
          hp={monsterTwo.hp}
          attack={monsterTwo.attack}
          defense={monsterTwo.defense}
          speed={monsterTwo.speed}
        />
      </div>
    </>
  );
}

export default App;
