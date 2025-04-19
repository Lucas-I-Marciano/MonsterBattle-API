// utils/damage.js

/**
 * Calcula o dano causado por um atacante a um defensor.
 * @param {object} attackerStats - Stats do atacante (precisa ter 'attack').
 * @param {object} defenderStats - Stats do defensor (precisa ter 'defense').
 * @param {boolean} defenderIsDefending - True se o defensor usou a ação "defend" neste turno.
 * @returns {number} O dano calculado (inteiro não negativo).
 */
export const calculateDamage = (
  attackerStats,
  defenderStats,
  defenderIsDefending
) => {
  // Multiplicador de defesa quando defendendo (ajuste conforme necessário)
  const defenseMultiplier = defenderIsDefending ? 1.5 : 1.0;

  // Dano bruto = ataque do atacante - defesa efetiva do defensor
  const rawDamage =
    attackerStats.attack - defenderStats.defense * defenseMultiplier;

  // Garante que o dano seja no mínimo 0 e um número inteiro
  const damageDealt = Math.max(0, Math.floor(rawDamage));

  // console.log(`Calc Dano: ${attackerStats.attack} atk vs ${defenderStats.defense * defenseMultiplier} def = ${damageDealt} dmg`); // Log opcional
  return damageDealt;
};

// A função calculateDefenseAbsorption não é mais necessária com esta abordagem.
// Pode removê-la ou comentá-la.
/*
export const calculateDefenseAbsorption = (
// ...
);
*/
