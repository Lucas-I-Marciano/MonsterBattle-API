import { Card } from "./Card";

export const CardTwo = ({ name, hp, attack, defense, speed }) => {
  return (
    <Card
      img="https://tse2.mm.bing.net/th/id/OIP.nG3Q4w00AdWGDHrvHK3-8wHaHa?w=1200&h=1200&rs=1&pid=ImgDetMain"
      name={name}
      hp={hp}
      attack={attack}
      defense={defense}
      speed={speed}
    />
  );
};
