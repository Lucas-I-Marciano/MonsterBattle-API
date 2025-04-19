import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";

// --- Utilitários ---
import { calculateDamage } from "./utils/damage.js"; // Importa a função atualizada

const require = createRequire(import.meta.url);
const cors = require("cors");
const prisma = new PrismaClient(); // Mantém o PrismaClient

import routers from "./routers/index.js"; // Mantém seus routers Express

const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Ajuste se o frontend estiver em outro lugar
  },
});

const port = 3000;

// ==================================================================
// GERENCIAMENTO DO ESTADO DA BATALHA (Nova Lógica)
// Coloque todas estas definições ANTES de io.on('connection', ...)
// ==================================================================

let roomInfo = {}; // Armazenamento temporário para jogadores antes da batalha { socketId: { playerId: id, monster: {...} } }
const MAX_PLAYERS = 2;
let battleState = null; // Guarda o estado da *única* batalha ativa. Começa como null.

// --- Funções Auxiliares ---
function getOpponentSocketId(socketId) {
  if (!battleState || !battleState.players) return null;
  const playerSocketIds = Object.keys(battleState.players);
  return playerSocketIds.find((id) => id !== socketId);
}

// --- Funções Principais da Batalha ---

function initializeBattleState(player1Data, player2Data) {
  // player1Data, player2Data = { socketId: '...', playerId: ..., monster: {...} }
  const p1Speed = player1Data.monster.speed;
  const p2Speed = player2Data.monster.speed;
  let turnOrderIds;
  if (p1Speed >= p2Speed) {
    // P1 mais rápido ou empate
    turnOrderIds = [player1Data.socketId, player2Data.socketId];
  } else {
    // P2 mais rápido
    turnOrderIds = [player2Data.socketId, player1Data.socketId];
  }

  battleState = {
    players: {
      [player1Data.socketId]: {
        playerId: player1Data.playerId,
        socketId: player1Data.socketId,
        monster: { ...player1Data.monster }, // Copia stats base
        currentHp: player1Data.monster.hp,
        chosenAction: null, // Ação escolhida no turno
        specialCooldown: 0, // Cooldown da habilidade especial
      },
      [player2Data.socketId]: {
        playerId: player2Data.playerId,
        socketId: player2Data.socketId,
        monster: { ...player2Data.monster },
        currentHp: player2Data.monster.hp,
        chosenAction: null,
        specialCooldown: 0,
      },
    },
    turnOrder: turnOrderIds, // Ordem de ação baseada na velocidade inicial
    currentTurn: 1,
    turnPhase: "waiting_for_actions", // 'waiting_for_actions', 'resolving', 'finished'
    actionsThisTurn: {}, // Guarda as ações { socketId: action }
    log: [], // Log de eventos da batalha
    status: "starting", // 'starting', 'active', 'finished'
    winner: null, // Guarda o socketId do vencedor
  };

  const firstPlayerName = battleState.players[turnOrderIds[0]].monster.name;
  battleState.log.push(
    `Turno ${battleState.currentTurn}: Batalha começando! ${firstPlayerName} age primeiro (Velocidade).`
  );
  console.log(
    "Battle State Initialized:",
    JSON.stringify(battleState, null, 2)
  ); // Log detalhado para debug
}

function endBattle(winnerSocketId) {
  if (!battleState || battleState.status === "finished") {
    console.log("endBattle chamado mas a batalha já terminou ou não existe.");
    return;
  }
  console.log(`Fim da batalha! Vencedor: ${winnerSocketId}`);
  battleState.status = "finished";
  battleState.winner = winnerSocketId;
  battleState.turnPhase = "finished";

  const winnerPlayer = winnerSocketId
    ? battleState.players[winnerSocketId]
    : null; // Pode ser null se acabou por erro
  const loserSocketId = winnerSocketId
    ? getOpponentSocketId(winnerSocketId)
    : null;
  const loserPlayer = loserSocketId ? battleState.players[loserSocketId] : null;

  battleState.log.push(`!!! FIM DA BATALHA !!!`);
  if (winnerPlayer) {
    battleState.log.push(
      `Vencedor: ${winnerPlayer.monster.name} (Jogador ${winnerPlayer.playerId})`
    );
  } else if (winnerSocketId) {
    battleState.log.push(`Vencedor: ${winnerSocketId} (W.O. ou erro)`);
  } else {
    battleState.log.push(
      `Batalha terminada sem vencedor claro (empate/abortada).`
    );
  }

  if (loserPlayer) {
    battleState.log.push(
      `Derrotado: ${loserPlayer.monster.name} (Jogador ${loserPlayer.playerId})`
    );
  } else if (loserSocketId) {
    battleState.log.push(
      `Oponente (${loserSocketId}) desconectou ou não encontrado.`
    );
  }

  const finalResult = {
    winner: winnerPlayer
      ? {
          // Envia dados do vencedor se existirem
          player_id: winnerPlayer.playerId,
          monster_name: winnerPlayer.monster.name,
        }
      : null, // Envia null se não houver vencedor claro
    battleLog: battleState.log,
    finalState: battleState, // Envia o estado final completo
  };

  io.emit("battle_end", finalResult); // Emite para todos os sockets conectados

  // Opcional: Limpar o estado para permitir uma nova batalha após um tempo
  // setTimeout(() => {
  //     console.log("Limpando estado da batalha finalizada.");
  //     battleState = null;
  //     roomInfo = {}; // Limpa sala de espera também
  // }, 20000); // Limpa após 20 segundos
}

// Função para aplicar habilidades especiais (IMPLEMENTAR A LÓGICA)
function applySpecialAbility(casterId, targetId) {
  if (
    !battleState ||
    !battleState.players[casterId] ||
    !battleState.players[targetId]
  )
    return;
  const caster = battleState.players[casterId];
  const target = battleState.players[targetId];
  const specialName = caster.monster.special;

  console.log(
    `${caster.monster.name} usa Habilidade Especial: ${specialName}!`
  );
  battleState.log.push(
    `Turno ${battleState.currentTurn}: ${caster.monster.name} usou ${specialName}!`
  );

  let damage = 0;
  // --- IMPLEMENTE A LÓGICA DA HABILIDADE AQUI ---
  if (specialName === "fireblast") {
    // Exemplo
    // Causa mais dano que ataque normal
    damage = Math.floor(caster.monster.attack * 1.7); // Ex: 70% mais dano
    target.currentHp -= damage;
    battleState.log.push(
      `---> ${target.monster.name} recebe ${damage} de dano especial! HP: ${target.currentHp}`
    );
  } else {
    // Adicione outras habilidades (cura, buff, debuff, etc.)
    battleState.log.push(
      `---> Efeito de ${specialName} aplicado! (Lógica a implementar)`
    );
  }
  // --- FIM DA LÓGICA ---

  caster.specialCooldown = 3; // Define cooldown para 3 turnos (após este)
  battleState.log.push(
    `(${caster.monster.name} precisa esperar ${caster.specialCooldown} turnos para usar novamente)`
  );
}

// Função para lidar com a ação recebida de um usuário
function handleUserAction(socketId, action) {
  // Verifica se a ação é válida no estado atual
  if (
    !battleState ||
    battleState.status !== "active" ||
    battleState.turnPhase !== "waiting_for_actions"
  ) {
    console.log(
      `Ação de ${socketId} (${action}) ignorada - Batalha não ativa ou não é hora de agir.`
    );
    io.to(socketId).emit("action_error", {
      message: "Não é possível realizar ação agora.",
    });
    return;
  }
  const player = battleState.players[socketId];
  if (!player) {
    console.error(`Erro: Jogador ${socketId} não encontrado no battleState.`);
    io.to(socketId).emit("action_error", {
      message: "Erro interno: jogador não encontrado.",
    });
    return;
  }
  if (player.chosenAction !== null) {
    console.log(
      `Jogador ${socketId} já escolheu a ação ${player.chosenAction} neste turno.`
    );
    io.to(socketId).emit("action_error", {
      message: "Você já agiu neste turno.",
    });
    return;
  }
  // Validação de Cooldown
  if (action === "special" && player.specialCooldown > 0) {
    const msg = `Habilidade especial em cooldown (${player.specialCooldown} turnos restantes).`;
    console.log(`Ação inválida de ${socketId}: ${msg}`);
    io.to(socketId).emit("action_error", { message: msg });
    return;
  }

  // Lidar com desistência (Forfeit) imediatamente
  if (action === "forfeit") {
    console.log(`Jogador ${socketId} (${player.monster.name}) desistiu.`);
    battleState.log.push(
      `Turno ${battleState.currentTurn}: ${player.monster.name} desistiu!`
    );
    const opponentId = getOpponentSocketId(socketId);
    endBattle(opponentId); // O oponente vence
    return; // Termina a execução aqui
  }

  // Armazena a ação
  player.chosenAction = action;
  battleState.actionsThisTurn[socketId] = action;
  console.log(
    `Ação recebida: ${player.monster.name} (${socketId}) escolheu ${action} no turno ${battleState.currentTurn}`
  );
  battleState.log.push(
    `Turno ${battleState.currentTurn}: ${player.monster.name} escolheu ${action}.`
  );

  // Confirma recebimento para o jogador (feedback visual no frontend)
  io.to(socketId).emit("action_confirmed", { action: action });
  // Atualiza estado para todos (mostra que este jogador agiu)
  io.emit("battle_update", battleState);

  // Verifica se ambos os jogadores agiram para resolver o turno
  const opponentSocketId = getOpponentSocketId(socketId);
  if (
    opponentSocketId &&
    battleState.players[opponentSocketId]?.chosenAction !== null
  ) {
    console.log(
      `Ambos os jogadores agiram no turno ${battleState.currentTurn}. Resolvendo...`
    );
    battleState.turnPhase = "resolving";
    io.emit("battle_update", battleState); // Mostra que está resolvendo
    setTimeout(resolveTurn, 1000); // Resolve após 1 segundo (para dar tempo de animações/leitura)
  } else {
    console.log(`Aguardando ação do oponente (${opponentSocketId}).`);
    io.to(socketId).emit("status_update", {
      message: "Aguardando oponente...",
    }); // Informa o jogador que aguarde
  }
}

// Função que resolve todas as ações do turno
function resolveTurn() {
  if (
    !battleState ||
    battleState.status !== "active" ||
    battleState.turnPhase !== "resolving"
  ) {
    console.error("resolveTurn chamado em estado inválido.");
    if (battleState) battleState.turnPhase = "waiting_for_actions"; // Tenta recuperar
    return;
  }
  console.log(`--- Resolvendo Turno ${battleState.currentTurn} ---`);

  // Garante que temos duas ações para processar
  const playerIdsWithActions = Object.keys(battleState.actionsThisTurn);
  if (playerIdsWithActions.length !== 2) {
    console.error(
      "Erro: Número incorreto de ações para resolver.",
      battleState.actionsThisTurn
    );
    // Possível desconexão entre ação e resolução? Resetar ações e esperar de novo.
    Object.values(battleState.players).forEach((p) => (p.chosenAction = null));
    battleState.actionsThisTurn = {};
    battleState.turnPhase = "waiting_for_actions";
    battleState.log.push("Erro ao resolver turno. Resetando ações.");
    io.emit("battle_update", battleState);
    return;
  }

  const id1 = playerIdsWithActions[0];
  const id2 = playerIdsWithActions[1];
  const player1 = battleState.players[id1];
  const player2 = battleState.players[id2];

  // Determina ordem de AÇÃO baseado na velocidade (quem ataca/usa especial primeiro)
  let firstActorId, secondActorId;
  if (player1.monster.speed >= player2.monster.speed) {
    firstActorId = id1;
    secondActorId = id2;
  } else {
    firstActorId = id2;
    secondActorId = id1;
  }
  battleState.log.push(
    `Ordem de resolução: ${battleState.players[firstActorId].monster.name} -> ${battleState.players[secondActorId].monster.name}`
  );

  // Função interna para processar a ação de UM jogador
  function processSingleAction(actorId, targetId) {
    // Se a batalha terminou no meio do processo, parar.
    if (!battleState || battleState.status !== "active") return false; // Indica que parou

    const actor = battleState.players[actorId];
    const target = battleState.players[targetId];
    // Usa actionsThisTurn pois chosenAction pode ser limpo antes do tempo
    const actorAction = battleState.actionsThisTurn[actorId];
    const targetAction = battleState.actionsThisTurn[targetId];
    const targetIsDefending = targetAction === "defend"; // Verifica se o alvo está defendendo *neste* turno

    // Segurança: Verifica se actor/target existem (caso de desconexão muito rápida)
    if (!actor || !target) {
      console.error(
        `Ator (${actorId}) ou Alvo (${targetId}) não encontrado durante processamento.`
      );
      return true; // Tenta continuar, mas pode dar erro adiante
    }

    console.log(
      `Processando: ${actor.monster.name} (${actorAction}) vs ${target.monster.name}`
    );

    if (actorAction === "attack") {
      const damage = calculateDamage(
        actor.monster,
        target.monster,
        targetIsDefending
      );
      target.currentHp -= damage;
      battleState.log.push(
        `-> ${actor.monster.name} ataca ${target.monster.name} causando ${damage} de dano.` +
          (targetIsDefending ? " (Defendendo!)" : "")
      );
    } else if (actorAction === "special") {
      applySpecialAbility(actorId, targetId); // Chama a função dedicada
    } else if (actorAction === "defend") {
      battleState.log.push(`-> ${actor.monster.name} está defendendo.`);
      // O efeito da defesa é considerado quando ele RECEBE o dano (targetIsDefending)
    }

    // --- Checa Vitória APÓS a ação ---
    if (target.currentHp <= 0) {
      target.currentHp = 0; // Não deixa HP negativo
      battleState.log.push(`!!! ${target.monster.name} foi derrotado !!!`);
      endBattle(actorId); // Quem aplicou o último golpe vence
      return false; // Indica que a batalha terminou
    }
    return true; // Indica que a batalha continua
  }

  // --- Executa as ações em ordem ---
  let battleContinues = true;
  // 1. Ação do mais rápido
  battleContinues = processSingleAction(firstActorId, secondActorId);

  // 2. Ação do mais lento (apenas se a batalha não acabou)
  if (battleContinues) {
    battleContinues = processSingleAction(secondActorId, firstActorId);
  }

  // --- Finaliza o turno (se a batalha ainda está ativa) ---
  if (battleContinues) {
    // Decrementa cooldowns ativos
    if (player1.specialCooldown > 0) player1.specialCooldown--;
    if (player2.specialCooldown > 0) player2.specialCooldown--;

    // Limpa ações para o próximo turno
    player1.chosenAction = null;
    player2.chosenAction = null;
    battleState.actionsThisTurn = {};

    // Avança o turno
    battleState.currentTurn++;
    battleState.turnPhase = "waiting_for_actions";

    // Adiciona log de fim de turno e HPs
    battleState.log.push(`--- Fim do Turno ${battleState.currentTurn - 1} ---`);
    battleState.log.push(
      `HP: ${player1.monster.name} [${player1.currentHp}/${player1.monster.hp}] | ${player2.monster.name} [${player2.currentHp}/${player2.monster.hp}]`
    );
    if (player1.specialCooldown > 0)
      battleState.log.push(
        `(${player1.monster.name} Cooldown: ${player1.specialCooldown})`
      );
    if (player2.specialCooldown > 0)
      battleState.log.push(
        `(${player2.monster.name} Cooldown: ${player2.specialCooldown})`
      );
    battleState.log.push(
      `Turno ${battleState.currentTurn}: Aguardando ações...`
    );

    // Emite estado atualizado para o próximo turno
    io.emit("battle_update", battleState);
    console.log(
      `Turno ${
        battleState.currentTurn - 1
      } resolvido. Aguardando ações para o turno ${battleState.currentTurn}.`
    );
  }
}

// ==================================================================
// HANDLERS DE EVENTOS SOCKET.IO (Usando as funções acima)
// ==================================================================

io.on("connection", (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  // --- Verificação na Conexão ---
  // Rejeita se já tem batalha ativa ou sala de espera cheia
  if (
    (battleState && battleState.status !== "finished") ||
    (Object.keys(roomInfo).length >= MAX_PLAYERS && !roomInfo[socket.id])
  ) {
    console.log(
      `Conexão recusada para ${socket.id}: Sala cheia ou batalha em andamento.`
    );
    socket.emit("room_full_error", {
      message: "Desculpe, a batalha está cheia ou em andamento.",
    });
    setTimeout(() => socket.disconnect(true), 500); // Desconecta após enviar msg
    return;
  }

  // --- Handlers de Eventos ---

  socket.on("userJoinRoom", async (data) => {
    // <<< Torna a função async para usar await com Prisma
    console.log(`userJoinRoom recebido de ${socket.id} com dados:`, data); // Log para ver o que chegou

    // --- Validação Atualizada ---
    // Espera apenas: { playerId: number }
    if (!data || typeof data.playerId !== "number") {
      console.error(
        "Dados inválidos para userJoinRoom (esperando apenas playerId):",
        data
      );
      socket.emit("join_error", {
        message: "Dados inválidos para entrar na sala (playerId).",
      });
      return;
    }

    const { playerId } = data; // Pega o ID do jogador enviado pelo frontend

    // --- Verificações de Sala/Batalha (como antes) ---
    if (battleState && battleState.status !== "finished") {
      console.log(
        `Tentativa de join recusada para ${socket.id} (playerId: ${playerId}): Batalha ativa.`
      );
      socket.emit("room_full_error", { message: "Batalha já em andamento." });
      return;
    }
    if (Object.keys(roomInfo).length >= MAX_PLAYERS && !roomInfo[socket.id]) {
      console.log(
        `Sala cheia na tentativa de join por ${socket.id} (playerId: ${playerId})`
      );
      socket.emit("room_full_error", {
        message: "Desculpe, a batalha já está cheia.",
      });
      return;
    }

    // --- LÓGICA PARA ATRIBUIR MONSTRO ALEATÓRIO (NOVO) ---
    let assignedMonster;
    try {
      // 1. Busca todos os monstros (ou apenas IDs se preferir)
      // É mais eficiente buscar todos os dados se não houver muitos monstros
      const allMonsters = await prisma.monster.findMany({
        // Você pode selecionar campos específicos se quiser:
        // select: { id: true, name: true, hp: true, attack: true, defense: true, speed: true, special: true }
      });
      if (!allMonsters || allMonsters.length === 0) {
        throw new Error("Nenhum monstro cadastrado no banco de dados.");
      }
      // 2. Escolhe um índice aleatório
      const randomIndex = Math.floor(Math.random() * allMonsters.length);
      assignedMonster = allMonsters[randomIndex]; // Pega o objeto completo do monstro
      console.log(
        `Monstro aleatório atribuído para ${playerId} (${socket.id}): ${assignedMonster.name} (ID: ${assignedMonster.id})`
      );
    } catch (error) {
      console.error(
        `Erro ao buscar/atribuir monstro para playerId ${playerId}:`,
        error
      );
      socket.emit("join_error", {
        message: "Erro interno ao selecionar monstro. Tente novamente.",
      });
      return; // Impede continuar se não conseguiu monstro
    }
    // --- Fim da Lógica do Monstro ---

    // --- Continua com a lógica de adicionar à sala (agora com o monstro) ---
    const playerData = {
      socketId: socket.id,
      playerId: playerId,
      monster: assignedMonster, // Usa o monstro que o backend acabou de buscar
    };

    if (!roomInfo[socket.id]) {
      roomInfo[socket.id] = playerData;
      console.log(
        `Jogador ${playerData.playerId} (${socket.id}) entrou com ${
          playerData.monster.name
        }. Sala: ${Object.keys(roomInfo).length}/${MAX_PLAYERS}`
      );
      // Informa ao jogador qual monstro ele recebeu e status da sala
      io.to(socket.id).emit("status_update", {
        message: `Você recebeu ${playerData.monster.name}! Aguardando ${
          MAX_PLAYERS - Object.keys(roomInfo).length
        } jogador(es)...`,
      });
    } else {
      // Se ele já estava (improvável neste fluxo, mas por segurança)
      console.log(
        `Jogador ${playerData.playerId} (${socket.id}) atualizado com ${playerData.monster.name}.`
      );
      roomInfo[socket.id] = playerData;
    }

    // --- LOGS DE DEPURAÇÃO ADICIONADOS ---
    const currentRoomSize = Object.keys(roomInfo).length;
    const isBattleStateNull = battleState === null;
    console.log(
      `[ANTES DO IF] Tamanho roomInfo: ${currentRoomSize}. battleState é null? ${isBattleStateNull}`
    );
    // --- FIM LOGS DE DEPURAÇÃO ---

    // --- Iniciar Batalha (Lógica existente) ---
    if (Object.keys(roomInfo).length === MAX_PLAYERS && battleState === null) {
      console.log(
        "[DENTRO DO IF] Condição atendida! Tentando iniciar batalha..."
      );
      console.log("Sala cheia! Iniciando batalha...");
      try {
        // Adiciona try...catch para capturar erros aqui dentro
        console.log("Sala cheia! Iniciando batalha..."); // Log original
        const playersArray = Object.values(roomInfo);

        // --- LOG DE DEPURAÇÃO ADICIONADO ---
        console.log(
          "[DENTRO DO IF] Dados para inicializar:",
          JSON.stringify(
            playersArray.map((p) => ({
              id: p.playerId,
              monster: p.monster.name,
            })),
            null,
            2
          )
        ); // Log mais conciso
        // --- FIM LOG DE DEPURAÇÃO ---

        initializeBattleState(playersArray[0], playersArray[1]);

        // --- LOG DE DEPURAÇÃO ADICIONADO ---
        if (!battleState) {
          // Verifica se initializeBattleState funcionou
          console.error(
            "[ERRO DENTRO DO IF] initializeBattleState não criou battleState!"
          );
          // O que fazer aqui? Talvez emitir um erro? Por enquanto, impede continuar.
          return;
        }
        console.log(
          "[DENTRO DO IF] battleState criado. Status inicial:",
          battleState.status
        );
        // --- FIM LOG DE DEPURAÇÃO ---

        battleState.status = "active";
        battleState.turnPhase = "waiting_for_actions";

        console.log(
          "[DENTRO DO IF] Emitindo battle_start para:",
          playersArray.map((p) => p.socketId)
        );
        playersArray.forEach((p) => {
          io.to(p.socketId).emit("battle_start", {
            message: "A batalha começou!",
            yourPlayerId: p.socketId,
            initialState: { ...battleState }, // Envia cópia
          });
        });

        roomInfo = {}; // Limpa sala de espera
        console.log(
          "Batalha iniciada, esperando ações para o turno:",
          battleState.currentTurn
        ); // Log original
      } catch (error) {
        console.error("!!! ERRO CRÍTICO AO INICIAR BATALHA !!!", error);
        // Reseta o estado para tentar permitir nova tentativa?
        battleState = null;
        // Notificar os jogadores?
        const playerSockets = Object.keys(roomInfo); // Pega os sockets que estavam na sala
        playerSockets.forEach((sockId) => {
          io.to(sockId).emit("join_error", {
            message:
              "Erro interno do servidor ao iniciar a batalha. Tente novamente.",
          });
        });
        roomInfo = {}; // Limpa roomInfo também
      }
    } else {
      // --- LOG DE DEPURAÇÃO ADICIONADO ---
      console.log(
        `[FORA DO IF] Condição NÃO atendida. Tamanho: ${currentRoomSize}, battleState null? ${isBattleStateNull}`
      );
      // --- FIM LOG DE DEPURAÇÃO ---
    }
  }); // Fim do handler userJoinRoom

  // Handler para receber a ação do jogador
  socket.on("userAction", (data) => {
    // Data esperada: { action: string }
    if (!data || typeof data.action !== "string") {
      console.error("Dados inválidos recebidos para userAction:", data);
      socket.emit("action_error", { message: "Ação inválida." });
      return;
    }
    // Delega para a função principal de lidar com ações
    handleUserAction(socket.id, data.action);
  });

  // Handler para desconexão
  socket.on("disconnect", () => {
    console.log(`Usuário desconectado: ${socket.id}`);

    // Se estava na sala de espera
    const wasInWaitingRoom = roomInfo[socket.id];
    if (wasInWaitingRoom) {
      const playerName = wasInWaitingRoom.monster?.name || socket.id;
      delete roomInfo[socket.id];
      console.log(`Removido ${playerName} (${socket.id}) da sala de espera.`);
      // Poderia notificar o outro jogador se houver um
    }

    // Se estava em uma batalha ativa
    if (
      battleState &&
      battleState.status === "active" &&
      battleState.players[socket.id]
    ) {
      const disconnectedPlayerName =
        battleState.players[socket.id]?.monster?.name || "Jogador";
      console.log(
        `Jogador ${disconnectedPlayerName} (${socket.id}) desconectou durante a batalha ativa.`
      );
      battleState.log.push(
        `!!! ${disconnectedPlayerName} (${socket.id}) desconectou !!!`
      );

      const opponentSocketId = getOpponentSocketId(socket.id);
      if (opponentSocketId && battleState.players[opponentSocketId]) {
        // Oponente vence por W.O.
        console.log(`Declarando ${opponentSocketId} como vencedor por W.O.`);
        battleState.log.push(
          `${battleState.players[opponentSocketId].monster.name} venceu por W.O.`
        );
        endBattle(opponentSocketId);
      } else {
        // Oponente não encontrado (pode ter desconectado também?)
        console.log(
          "Oponente não encontrado ou já desconectado. Abortando batalha."
        );
        battleState.status = "finished";
        battleState.winner = null; // Sem vencedor claro
        battleState.log.push(
          `!!! BATALHA ABORTADA (Desconexão Mútua/Erro) !!!`
        );
        io.emit("battle_abort", {
          message: "Batalha abortada devido a desconexões.",
          finalState: battleState,
        });
        // Talvez limpar battleState aqui também: battleState = null;
      }
    }
    // Limpeza do banco de dados (opcional e com ressalvas)
    // Tentar deletar pelo ID do jogador seria mais seguro que pelo socket.id
    // Ex: const player = await prisma.player.findUnique({ where: { id: playerId } }); if (player) ... delete
  });

  // Remover 'userOnRoom' ou adaptar se necessário
  // O evento 'battle_update' agora envia o estado completo quando relevante.
});

// ==================================================================
// SETUP DO EXPRESS (Mantém como estava)
// ==================================================================
app.use(cors());
app.use(express.json());
routers(app); // Configura as rotas da API REST

server.listen(port, async () => {
  console.log(`Servidor rodando na porta: ${port}`);
  // Limpeza no início (apenas para desenvolvimento)
  try {
    await prisma.player.deleteMany({}); // CUIDADO: Apaga todos os jogadores!
    console.log("Tabela de jogadores limpa no início.");
  } catch (error) {
    console.error("Erro ao limpar tabela de jogadores:", error);
  }
  // Reseta estado da batalha no início do servidor
  battleState = null;
  roomInfo = {};
  console.log("Servidor iniciado. Estado da batalha resetado.");
});
