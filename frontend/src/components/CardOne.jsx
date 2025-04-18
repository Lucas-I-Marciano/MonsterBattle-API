import { Card } from "./Card";

export const CardOne = ({ name, hp, attack, defense, speed, actions }) => {
  return (
    <Card
      img="https://tse3.mm.bing.net/th/id/OIP.bXzELIdDQznCCpkF0PstVgHaHa?rs=1&pid=ImgDetMain"
      name={name}
      hp={hp}
      attack={attack}
      defense={defense}
      speed={speed}
      actions={actions}
    />
  );
};
