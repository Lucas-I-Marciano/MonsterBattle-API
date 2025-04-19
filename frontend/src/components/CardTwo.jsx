import React from "react"; // Só precisamos de React

// Você pode copiar o componente HealthBar aqui ou importá-lo se o moveu para um arquivo separado
const HealthBar = ({ current, max }) => {
  const percentage =
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = "bg-green-500";
  if (percentage < 50) barColor = "bg-yellow-500";
  if (percentage < 25) barColor = "bg-red-500";

  return (
    <div className="w-full bg-gray-300 rounded-full h-4 my-1 border border-gray-400 relative">
      {" "}
      {/* Adicionado relative */}
      <div
        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
      {/* Posiciona o texto dentro da barra */}
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black pointer-events-none">
        {" "}
        {/* pointer-events-none para não interferir com tooltips futuros */}
        {current} / {max}
      </span>
    </div>
  );
};

// Atualizamos as props para refletir os dados do oponente vindos do battleState
export const CardTwo = ({
  img,
  name,
  currentHp, // Renomeado de hp
  maxHp, // Novo
  attack,
  defense,
  speed,
  specialName, // Novo
  cooldown, // Novo
  chosenAction, // Novo - Para saber se o oponente já agiu
}) => {
  // Define uma mensagem se o oponente já escolheu a ação (sem revelar qual)
  const opponentActionStatus = chosenAction
    ? "(Ação Escolhida)"
    : "(Aguardando Ação)";

  // Removemos o reducer, useState, useEffect, handleAction - não são necessários aqui

  return (
    // Adicionando uma borda vermelha para diferenciar (opcional)
    <div className="max-w-xs mx-auto my-4 bg-white shadow-xl rounded-lg text-gray-900 border-2 border-red-300">
      {/* Imagem do Monstro */}
      <div className="mx-auto w-32 h-32 relative mt-4 border-4 border-white rounded-full overflow-hidden">
        <img
          className="object-cover object-center h-32 w-full" // Adicionado w-full
          src={img}
          alt={name || "Monstro Oponente"}
        />
      </div>

      {/* Nome e Vida */}
      <div className="text-center mt-2 px-4">
        {/* Mantendo a cor vermelha para o nome do oponente como no original */}
        <h2 className="font-semibold text-xl text-red-600">
          {name || "Oponente"}
        </h2>
        <HealthBar current={currentHp ?? 0} max={maxHp ?? 100} />
        {/* Mostra HP e se o oponente já agiu */}
        <p className="text-xs text-gray-600">
          HP: {currentHp ?? "?"} / {maxHp ?? "?"} {opponentActionStatus}
        </p>
      </div>

      {/* Stats - Mantendo o tema vermelho */}
      <ul className="py-2 mt-1 text-xs text-red-700 flex items-center justify-around border-t border-b mx-4">
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-red-800">ATK</span>
          <div className="text-center">{attack ?? "?"}</div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-red-800">DEF</span>
          <div className="text-center">{defense ?? "?"}</div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-red-800">SPD</span>
          <div className="text-center">{speed ?? "?"}</div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          {/* Pode usar outra cor para Special ou manter roxo */}
          <span className="font-bold text-purple-700">Special</span>
          <div className="text-center text-xxs" title={specialName}>
            {specialName || "?"}
          </div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-purple-700">Cooldown</span>
          {/* Mostra status do cooldown */}
          <div
            className={`text-center font-semibold ${
              cooldown > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {cooldown > 0
              ? `${cooldown} turno${cooldown > 1 ? "s" : ""}`
              : "Pronto"}
          </div>
        </li>
      </ul>

      {/* Espaço vazio onde ficariam os botões, para manter alinhamento */}
      <div className="p-4 mx-4 mt-1">
        <div className="h-20">
          {" "}
          {/* Altura similar à área dos botões do Card */}
          {/* Pode adicionar alguma informação extra aqui se quiser */}
        </div>
      </div>
    </div>
  );
};
