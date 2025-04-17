import { useEffect, useState } from "react";
import { socket } from "./socket";

import { CardOne } from "./components/CardOne";
import { CardTwo } from "./components/CardTwo";

import { joinArena } from "./services/arena";
import { randomMonster } from "./services/monster";

function App() {
  const [isTwoPlayers, setIsTwoPlayers] = useState(false);
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
    const result = async () => {
      const response = await joinArena(5, 3);
      const monster = await randomMonster(response["monster_id"]);
      setMonsterOne(monster);
      const socketId = socket.id.toString();
      socket.emit("userJoinRoom", { [socketId]: { monster } });

      const response_ = await joinArena(5, 3);
      const monster_ = await randomMonster(response_["monster_id"]);
      setMonsterTwo(monster_);
    };

    socket.on("roomInfo", (data) => {
      if (Object.keys(data).length === 2) {
        setIsTwoPlayers(true);
      }
    });

    socket.on("userDisconnected", (data) => {
      console.log("userDisconnected");
    });

    result();
  }, []);
  return (
    <>
      {isTwoPlayers ? (
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
      ) : (
        <div className="font-bold text-2xl">Waiting another player...</div>
      )}
    </>
  );
}

export default App;
