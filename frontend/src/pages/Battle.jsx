import { useEffect, useState } from "react";
import { socket } from "../socket";

import loading from "../assets/gifs/loading.gif";

import { CardTwo } from "../components/CardTwo";
import { Card } from "../components/Card";
import myMonster from "../assets/images/myMonster.jpg";
import opponent from "../assets/images/opponent.jpg";

export const Battle = () => {
  const [isTwoPlayers, setIsTwoPlayers] = useState(false);
  const [monsterOne, setMonsterOne] = useState({});
  const [monsterTwo, setMonsterTwo] = useState({});

  useEffect(() => {
    socket.emit("userOnRoom");

    socket.on("roomInfo", (data) => {
      if (Object.keys(data).length === 2) {
        setIsTwoPlayers(true);
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

        setMonsterOne(arrayMonsterOne[0][1]["monster"]);
        setMonsterTwo(arrayMonsterTwo[0][1]["monster"]);
      } else {
        setIsTwoPlayers(false);
      }
    });

    socket.on("turnFinished", (data) => {
      const lastTurn = Math.max(...Object.keys(data));
      const lastTurnInfo = data[lastTurn];

      const novaInfo = lastTurnInfo[socket.id];
      setMonsterOne({
        id: 1,
        name: novaInfo.name,
        hp: novaInfo.hp,
        attack: novaInfo.attack,
        defense: novaInfo.defense,
        special: "Roar!",
        speed: novaInfo.speed,
      });

      const outroSocket = Object.keys(lastTurnInfo).filter((eachSocketId) => {
        return eachSocketId !== socket.id;
      })[0];
      const outraNovaInfo = lastTurnInfo[outroSocket];
      setMonsterTwo({
        id: 1,
        name: outraNovaInfo.name,
        hp: outraNovaInfo.hp,
        attack: outraNovaInfo.attack,
        defense: outraNovaInfo.defense,
        special: "Roar!",
        speed: outraNovaInfo.speed,
      });
    });
  }, []);

  const actions = (modifiers) => {
    return { modifiers };
  };

  return (
    <>
      {isTwoPlayers ? (
        <div className="flex">
          <Card
            img={myMonster}
            name={monsterOne.name}
            hp={monsterOne.hp}
            attack={monsterOne.attack}
            defense={monsterOne.defense}
            speed={monsterOne.speed}
            actions={actions}
          />
          <CardTwo
            img={opponent}
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
