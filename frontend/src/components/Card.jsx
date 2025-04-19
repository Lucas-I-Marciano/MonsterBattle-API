import React from "react"; // Só precisamos do React

// Componente HealthBar (pode ficar aqui ou ser importado de outro arquivo)
const HealthBar = ({ current, max }) => {
  // Garante que max não seja zero para evitar divisão por zero
  // Calcula a porcentagem, garantindo que fique entre 0 e 100
  const percentage =
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = "bg-green-500"; // Verde padrão
  if (percentage < 50) barColor = "bg-yellow-500"; // Amarelo se abaixo de 50%
  if (percentage < 25) barColor = "bg-red-500"; // Vermelho se abaixo de 25%

  return (
    // Container da barra com fundo cinza e borda
    <div className="w-full bg-gray-300 rounded-full h-4 my-1 border border-gray-400 relative overflow-hidden">
      {" "}
      {/* Adicionado relative e overflow-hidden */}
      {/* Barra de vida colorida com transição */}
      <div
        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
      {/* Texto (HP atual / HP máximo) centralizado sobre a barra */}
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black pointer-events-none">
        {" "}
        {/* pointer-events-none evita que o texto capture eventos de mouse */}
        {current ?? "?"} / {max ?? "?"}{" "}
        {/* Usa ?? para mostrar '?' se os valores forem null/undefined */}
      </span>
    </div>
  );
};

// Componente Card para o jogador
export const Card = ({
  img, // Imagem do monstro
  name, // Nome do monstro
  currentHp, // HP atual
  maxHp, // HP máximo
  attack, // Atributo de ataque
  defense, // Atributo de defesa
  speed, // Atributo de velocidade
  specialName, // Nome da habilidade especial
  cooldown, // Turnos restantes para cooldown (0 se pronto)
  isPlayerTurn, // Boolean: É a vez deste jogador agir?
  chosenAction, // String ou null: Qual ação foi escolhida neste turno?
  onAttack, // Função a ser chamada ao clicar em Atacar
  onDefend, // Função a ser chamada ao clicar em Defender
  onSpecial, // Função a ser chamada ao clicar em Especial
  onForfeit, // Função a ser chamada ao clicar em Desistir
  isSpecialReady, // Boolean: A habilidade especial pode ser usada (cooldown === 0)?
}) => {
  // Determina se os botões de ação principais devem estar desabilitados
  const isDisabled = !isPlayerTurn || chosenAction !== null;
  // Determina se o botão de especial está desabilitado (condição geral + cooldown)
  const isSpecialDisabled = isDisabled || !isSpecialReady;

  // Feedback visual opcional para indicar ação escolhida
  const actionFeedback = chosenAction ? `(Ação: ${chosenAction})` : "";

  return (
    // Container principal do card com borda azul para diferenciar do oponente
    <div className="max-w-xs mx-auto my-4 bg-white shadow-xl rounded-lg text-gray-900 border-2 border-blue-300">
      {/* Imagem do Monstro */}
      <div className="mx-auto w-32 h-32 relative mt-4 border-4 border-white rounded-full overflow-hidden">
        <img
          className="object-cover object-center h-32 w-full" // Garante que a imagem cubra a área
          src={img}
          alt={name || "Seu Monstro"} // Texto alternativo
        />
      </div>

      {/* Nome e Barra de Vida */}
      <div className="text-center mt-2 px-4">
        <h2 className="font-semibold text-xl">{name || "Carregando..."}</h2>
        <HealthBar current={currentHp ?? 0} max={maxHp ?? 100} />
        {/* Texto de HP e feedback da ação */}
        <p className="text-xs text-gray-600">
          HP: {currentHp ?? "?"} / {maxHp ?? "?"} {actionFeedback}
        </p>
      </div>

      {/* Atributos */}
      <ul className="py-2 mt-1 text-xs text-gray-700 flex items-center justify-around border-t border-b mx-4">
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-blue-700">ATK</span>
          <div className="text-center">{attack ?? "?"}</div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-blue-700">DEF</span>
          <div className="text-center">{defense ?? "?"}</div>
        </li>
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-blue-700">SPD</span>
          <div className="text-center">{speed ?? "?"}</div>
        </li>
        {/* Habilidade Especial */}
        <li
          className="flex flex-col items-center justify-center px-1"
          title={specialName || "Habilidade Especial"}
        >
          {" "}
          {/* Tooltip com o nome */}
          <span className="font-bold text-purple-700">Special</span>
          <div className="text-center text-xxs">{specialName || "?"}</div>
        </li>
        {/* Cooldown da Habilidade Especial */}
        <li className="flex flex-col items-center justify-center px-1">
          <span className="font-bold text-purple-700">Cooldown</span>
          {/* Mostra o status do cooldown com cores */}
          <div
            className={`text-center font-semibold ${
              cooldown > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {cooldown > 0
              ? `${cooldown} turno${cooldown > 1 ? "s" : ""}`
              : "Pronto!"}
          </div>
        </li>
      </ul>

      {/* Área dos Botões de Ação */}
      <div className="p-4 mx-4 mt-1">
        {/* Mensagem indicando o estado do turno do jogador */}
        <p className="text-center text-sm font-semibold mb-2 h-5">
          {" "}
          {/* Altura fixa para evitar pulos */}
          {isPlayerTurn && !chosenAction && "Escolha sua ação!"}
          {isPlayerTurn && chosenAction && "Ação escolhida!"}
          {!isPlayerTurn && "Aguardando..."}
        </p>
        {/* Layout em grade para os botões */}
        <div className="grid grid-cols-2 gap-3">
          {/* Botão Atacar */}
          <button
            disabled={isDisabled} // Usa o estado de desabilitação geral
            onClick={onAttack} // Chama a função passada via prop
            className={`w-full block rounded-full font-semibold text-white px-4 py-2 text-sm transition duration-200 ease-in-out ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed opacity-70" // Estilo desabilitado
                : "bg-red-600 hover:bg-red-700" // Estilo habilitado
            }`}
          >
            Atacar
          </button>

          {/* Botão Defender */}
          <button
            disabled={isDisabled}
            onClick={onDefend}
            className={`w-full block rounded-full font-semibold text-white px-4 py-2 text-sm transition duration-200 ease-in-out ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Defender
          </button>

          {/* Botão Especial */}
          <button
            disabled={isSpecialDisabled} // Usa o estado de desabilitação específico do especial
            onClick={onSpecial}
            title={specialName || "Habilidade Especial"} // Tooltip com o nome da habilidade
            className={`w-full block rounded-full font-semibold text-white px-4 py-2 text-sm transition duration-200 ease-in-out ${
              isSpecialDisabled
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {/* Mostra o cooldown no botão se estiver ativo */}
            Especial {cooldown > 0 ? `(${cooldown})` : ""}
          </button>

          {/* Botão Desistir */}
          <button
            // Desabilitado se não for o turno do jogador ou se ele já escolheu uma ação principal
            disabled={!isPlayerTurn || chosenAction !== null}
            onClick={onForfeit}
            className={`w-full block rounded-full font-semibold text-white px-4 py-2 text-sm transition duration-200 ease-in-out ${
              !isPlayerTurn || chosenAction !== null
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-gray-700 hover:bg-gray-800" // Cinza escuro para desistir
            }`}
          >
            Desistir
          </button>
        </div>
      </div>
    </div>
  );
};
