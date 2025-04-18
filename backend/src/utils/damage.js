export const calculateDamage = (attacker, defender, multiplier = 1) => {
  const damage = attacker.attack - defender.defense * multiplier;
  return Math.max(defender.hp - damage, 0);
};

export const calculateDefenseAbsorption = (
  defender,
  attacker,
  multiplier = 1
) => {
  const counter = defender.defense * multiplier - attacker.attack;
  return Math.max(attacker.hp - counter, 0);
};
