import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"; // Adiciona useRef
import { socket } from "../socket";
import { useLocation, useNavigate } from "react-router";

// Importe seus componentes e assets
import loadingGif from "../assets/gifs/loading.gif";
import { CardTwo } from "../components/CardTwo";
import { Card } from "../components/Card";
import myMonsterImg from "../assets/images/myMonster.jpg";
import opponentImg from "../assets/images/opponent.jpg";

// -- Componente HealthBar (sem alterações) --
const HealthBar = ({ current, max }) => {
  const percentage =
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  let barColor = "bg-green-500";
  if (percentage < 50) barColor = "bg-yellow-500";
  if (percentage < 25) barColor = "bg-red-500";

  return (
    <div className="w-full bg-gray-300 rounded-full h-4 my-1 border border-gray-400 relative overflow-hidden">
      <div
        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black pointer-events-none">
        {current ?? "?"} / {max ?? "?"}
      </span>
    </div>
  );
};

// --- Componente Principal da Batalha ---
export const Battle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Estados ---
  const [battleState, setBattleState] = useState(
    () => location.state?.initialBattleState || null
  );
  const [yourPlayerId, setYourPlayerId] = useState(
    () => location.state?.playerSocketId || socket.id
  );
  const [battleError, setBattleError] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const errorTimeoutRef = useRef(null); // Ref para guardar o ID do timeout do erro

  // --- Efeito para checar estado inicial ---
  useEffect(() => {
    if (!battleState && !location.state?.initialBattleState) {
      console.warn(
        "Battle.jsx: Estado inicial não encontrado! Voltando para Home."
      );
      setBattleError(
        "Não foi possível carregar a batalha. Por favor, entre novamente."
      );
      // Opcional: redirecionar
      // const timer = setTimeout(() => navigate('/'), 5000);
      // return () => clearTimeout(timer);
    } else if (socket.id !== yourPlayerId && !location.state?.playerSocketId) {
      console.warn(
        `Battle.jsx: ID do socket atual (${socket.id}) diferente do ID inicial (${yourPlayerId}).`
      );
      // Considerar atualizar o ID ou forçar recarga de estado se necessário
    }
  }, [battleState, location.state, navigate, yourPlayerId]);

  // --- Efeito para atualizar o log visível ---
  useEffect(() => {
    if (battleState?.log) {
      const maxLogsToShow = 15;
      setBattleLog(battleState.log.slice(-maxLogsToShow));
    }
  }, [battleState?.log]);

  // --- Efeito para configurar listeners do Socket.IO ---
  useEffect(() => {
    console.log(
      `Battle.jsx: Configurando listeners. ID Jogador: ${yourPlayerId}`
    );

    const onBattleUpdate = (newState) => {
      console.log("EVENTO: battle_update recebido.");
      setBattleError(null);
      setBattleState(newState);
    };

    const onBattleEnd = (finalResult) => {
      console.log("EVENTO: battle_end recebido:", finalResult);
      setBattleError(null);
      // --- CORREÇÃO AQUI ---
      // Se finalResult.finalState existir, usa ele. Senão, atualiza o estado anterior.
      if (finalResult.finalState) {
        setBattleState(finalResult.finalState);
      } else {
        setBattleState((prev) => {
          // Garante que 'prev' não seja null antes de espalhar
          if (!prev)
            return {
              status: "finished",
              winner: finalResult.winner?.socket_id || null,
              players: {},
              log: [],
            }; // Estado final mínimo
          return {
            ...prev,
            status: "finished",
            winner: finalResult.winner?.socket_id || null,
          };
        });
      }
      // --- FIM CORREÇÃO ---
    };

    const onActionError = (data) => {
      console.error("EVENTO: action_error recebido:", data.message);
      setBattleError(data.message);
      // Limpa qualquer timeout anterior para esta mensagem de erro
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      // Define um novo timeout e guarda seu ID na ref
      errorTimeoutRef.current = setTimeout(() => {
        setBattleError(null);
        errorTimeoutRef.current = null; // Limpa a ref após executar
      }, 5000);
    };

    const onBattleAbort = (data) => {
      console.warn("EVENTO: battle_abort recebido:", data.message);
      setBattleError(data.message || "Batalha abortada.");
      // --- CORREÇÃO AQUI ---
      if (data.finalState) {
        setBattleState(data.finalState);
      } else {
        setBattleState((prev) => {
          if (!prev)
            return { status: "finished", winner: null, players: {}, log: [] };
          return { ...prev, status: "finished", winner: null };
        });
      }
      // --- FIM CORREÇÃO ---
    };

    // Registra os listeners
    socket.on("battle_update", onBattleUpdate);
    socket.on("battle_end", onBattleEnd);
    socket.on("action_error", onActionError);
    socket.on("battle_abort", onBattleAbort);

    // Função de limpeza principal do useEffect
    return () => {
      console.log("Battle.jsx: Limpando listeners e timeout de erro.");
      socket.off("battle_update", onBattleUpdate);
      socket.off("battle_end", onBattleEnd);
      socket.off("action_error", onActionError);
      socket.off("battle_abort", onBattleAbort);
      // --- Limpa o timeout se o componente desmontar antes dele executar ---
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
    // Dependências do useEffect
  }, [yourPlayerId]); // Depende de yourPlayerId

  // --- Memoização (sem alterações) ---
  const playerData = useMemo(() => {
    if (!battleState || !yourPlayerId || !battleState.players[yourPlayerId])
      return null;
    return battleState.players[yourPlayerId];
  }, [battleState, yourPlayerId]);

  const opponentId = useMemo(() => {
    if (!battleState || !yourPlayerId || !battleState.players) return null; // Adicionado check para players
    return Object.keys(battleState.players).find((id) => id !== yourPlayerId);
  }, [battleState, yourPlayerId]);

  const opponentData = useMemo(() => {
    if (!battleState || !opponentId || !battleState.players[opponentId])
      return null;
    return battleState.players[opponentId];
  }, [battleState, opponentId]);

  // --- Handler de Ação (sem alterações) ---
  const handleAction = useCallback(
    (action) => {
      if (
        !battleState ||
        battleState.status !== "active" ||
        battleState.turnPhase !== "waiting_for_actions" ||
        !playerData ||
        playerData.chosenAction
      ) {
        console.warn("Ação bloqueada no momento:", action);
        return;
      }
      if (action === "special" && playerData.specialCooldown > 0) {
        const msg = `Habilidade especial em cooldown (${playerData.specialCooldown} turnos)`;
        console.warn(msg);
        setBattleError(msg);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current); // Limpa timeout anterior
        errorTimeoutRef.current = setTimeout(() => {
          setBattleError(null);
          errorTimeoutRef.current = null;
        }, 3000);
        return;
      }
      console.log(`Enviando ação "${action}" para o backend.`);
      setBattleError(null);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current); // Limpa timeout se enviar ação

      socket.emit("userAction", { action: action });
    },
    [battleState, playerData]
  );

  // --- Lógica de Renderização ---
  console.log(
    "Renderizando Battle.jsx - Status:",
    battleState?.status,
    "| Player Data?",
    !!playerData,
    "| Opponent Data?",
    !!opponentData
  );

  // 1. Tela de Carregamento / Espera / Erro Inicial
  if (!battleState || !playerData || !opponentData) {
    if (battleError) {
      return (
        <div className="py-20 font-bold text-2xl w-full flex flex-col justify-center items-center text-center px-4">
          <p className="text-red-600">{battleError}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Voltar para Home
          </button>
        </div>
      );
    }
    return (
      <div className="py-20 font-bold text-2xl w-full flex flex-col justify-center items-center">
        Carregando Batalha / Sincronizando...
        <img className="w-20 py-20" src={loadingGif} alt="loading..." />
      </div>
    );
  }

  // 2. Tela de Fim de Jogo (sem alterações significativas)
  if (battleState.status === "finished") {
    let endMessage = "A Batalha Terminou!";
    if (battleState.winner === yourPlayerId) {
      endMessage = "🎉 Você Venceu! 🎉";
    } else if (battleState.winner === opponentId) {
      endMessage = "😥 Você Perdeu... 😥";
    } else if (battleState.winner === null) {
      endMessage = battleError || "Batalha Abortada ou Empate.";
    }
    return (
      <div className="py-20 font-bold text-2xl w-full flex flex-col justify-center items-center text-center px-4">
        <h2 className="mb-4">{endMessage}</h2>
        <div className="mt-4 text-sm border rounded p-4 w-full max-w-md max-h-60 overflow-y-auto bg-gray-100 text-left">
          <h3 className="font-bold mb-2 text-center">Log Final:</h3>
          {[...battleLog].reverse().map((log, index) => (
            <p key={index} className="text-xs mb-1">
              {log}
            </p>
          ))}
        </div>
        <button
          onClick={() => navigate("/")}
          className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Jogar Novamente
        </button>
      </div>
    );
  }

  // 3. Tela Principal da Batalha (sem alterações significativas)
  const canPlayerAct =
    battleState.turnPhase === "waiting_for_actions" && !playerData.chosenAction;
  const isSpecialReady = playerData.specialCooldown === 0;

  return (
    <div className="p-4">
      {/* Mensagem de Status / Erro durante a batalha */}
      {battleError && (
        <p className="text-center text-red-600 font-bold mb-4 p-2 bg-red-100 border border-red-300 rounded">
          {battleError}
        </p>
      )}
      {/* Informações do Turno */}
      <p className="text-center font-semibold mb-4 text-lg">
        Turno: {battleState.currentTurn}
        <span className="mx-2">|</span>
        {battleState.turnPhase === "waiting_for_actions" &&
          !playerData.chosenAction && (
            <span className="text-blue-600">Sua vez de agir!</span>
          )}
        {battleState.turnPhase === "waiting_for_actions" &&
          playerData.chosenAction && (
            <span className="text-gray-600">Aguardando oponente...</span>
          )}
        {battleState.turnPhase === "resolving" && (
          <span className="text-orange-600">Resolvendo ações...</span>
        )}
      </p>

      {/* Container dos Cards */}
      <div className="flex flex-col md:flex-row justify-around items-start md:items-center gap-4">
        {/* Card do Jogador */}
        <Card
          img={myMonsterImg}
          name={playerData.monster.name}
          currentHp={playerData.currentHp}
          maxHp={playerData.monster.hp}
          attack={playerData.monster.attack}
          defense={playerData.monster.defense}
          speed={playerData.monster.speed}
          specialName={playerData.monster.special}
          cooldown={playerData.specialCooldown}
          isPlayerTurn={canPlayerAct}
          chosenAction={playerData.chosenAction}
          isSpecialReady={isSpecialReady}
          onAttack={() => handleAction("attack")}
          onDefend={() => handleAction("defend")}
          onSpecial={() => handleAction("special")}
          onForfeit={() => handleAction("forfeit")}
        />

        {/* Card do Oponente */}
        <CardTwo
          img={opponentImg}
          name={opponentData.monster.name}
          currentHp={opponentData.currentHp}
          maxHp={opponentData.monster.hp}
          attack={opponentData.monster.attack}
          defense={opponentData.monster.defense}
          speed={opponentData.monster.speed}
          specialName={opponentData.monster.special}
          cooldown={opponentData.specialCooldown}
          chosenAction={opponentData.chosenAction}
        />
      </div>

      {/* Log da Batalha */}
      <div className="mt-8 border rounded p-4 w-full max-w-3xl mx-auto max-h-48 overflow-y-auto bg-gray-50 shadow-inner">
        <h3 className="font-bold mb-2 text-center">Log da Batalha</h3>
        {battleLog.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            A batalha começou...
          </p>
        )}
        {[...battleLog].reverse().map((log, index) => (
          <p key={index} className="text-xs mb-1 border-b pb-1">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
  // Fechamento correto do componente - a linha 308 original provavelmente tinha um erro aqui
}; // <<<<< FECHAMENTO DO COMPONENTE Battle
