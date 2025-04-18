import { useEffect, useState } from "react";
import { socket } from "../socket";

import loading from "../assets/gifs/loading.gif";

import { CardOne } from "../components/CardOne";
import { CardTwo } from "../components/CardTwo";

export const Battle = () => {
  const [isTwoPlayers, setIsTwoPlayers] = useState(false);
  const [monsterOne, setMonsterOne] = useState({});
  const [monsterTwo, setMonsterTwo] = useState({});

  useEffect(() => {
    socket.on("roomInfo", (data) => {
      if (Object.keys(data).length === 2) {
        setIsTwoPlayers(true);
        console.log(Object.entries(data));
        const arrayMonsterOne = Object.entries(data).filter(
          ([socketEntry, _]) => {
            return socketEntry === socket.id;
          }
        );
        const arrayMonsterTwo = Object.entries(data).filter(
          ([socketEntry, _]) => {
            return socketEntry !== socket.id;
          }
        );
        console.log(arrayMonsterOne[0][1]["monster"]);

        setMonsterOne(arrayMonsterOne[0][1]["monster"]);
        setMonsterTwo(arrayMonsterTwo[0][1]["monster"]);
      }
    });

    socket.on("userDisconnected", (data) => {
      console.log("userDisconnected");
    });
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
        <div className="py-20 font-bold text-2xl w-full flex flex-col justify-center items-center">
          Waiting another player...
          <img className="w-20 py-20" src={loading} alt="loading..." />
        </div>
      )}
    </>
  );
};
