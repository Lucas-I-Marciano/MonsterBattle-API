import React, { useState, useEffect } from "react"; // Garanta que React, useState e useEffect estão importados
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router";

import { createPlayer } from "../services/player";
import { socket } from "../socket"; // Importa a instância do socket

const schema = yup
  .object({
    name: yup.string().required("Por favor, escolha um nome"),
  })
  .required();

export const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // --- NOVO ESTADO ---: Rastreia o status da conexão
  const [isConnected, setIsConnected] = useState(socket.connected); // Inicializa com o status atual do socket

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // useEffect para lidar com TODOS os eventos do Socket.IO relevantes para este componente
  useEffect(() => {
    // Função chamada quando o socket conecta
    function onConnect() {
      console.log('Home.jsx: Evento "connect" recebido.');
      setIsConnected(true); // <<< ATUALIZA O ESTADO DO REACT
    }

    // Função chamada quando o socket desconecta
    function onDisconnect() {
      console.log('Home.jsx: Evento "disconnect" recebido.');
      setIsConnected(false); // <<< ATUALIZA O ESTADO DO REACT
      // Opcional: Limpar erro ou definir um erro de desconexão
      // setError("Desconectado do servidor.");
    }

    // Funções para os outros eventos (battle_start, etc.)
    function onBattleStart(data) {
      console.log(">>> HOME.JSX recebeu battle_start! <<<");
      // Verifica se os dados necessários estão presentes
      if (data && data.initialState && data.yourPlayerId) {
        console.log("Navegando para /battle e passando o estado inicial...");
        setIsLoading(false); // Para o loading do botão Home

        // --- PASSA O ESTADO AQUI ---
        navigate("/battle", {
          replace: true, // Opcional: substitui Home no histórico
          state: {
            initialBattleState: data.initialState, // O estado completo da batalha
            playerSocketId: data.yourPlayerId, // O ID do socket deste jogador
          },
        });
        // --- FIM DA PASSAGEM DE ESTADO ---
      } else {
        // Log de erro se os dados não vierem como esperado
        console.error(
          "Home.jsx: battle_start recebido, mas faltou initialState ou yourPlayerId!",
          data
        );
        setError("Erro ao receber dados iniciais da batalha do servidor.");
        setIsLoading(false);
      }
    }
    function onRoomFullError(data) {
      console.error("Room full error:", data.message);
      setError(`Não foi possível entrar: ${data.message}`);
      setIsLoading(false);
      reset();
    }
    function onJoinError(data) {
      console.error("Join error:", data.message);
      setError(`Erro ao entrar: ${data.message}`);
      setIsLoading(false);
      reset();
    }

    // Registrar listeners para connect e disconnect
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // Registrar listeners para eventos da lógica do jogo
    socket.on("battle_start", onBattleStart);
    socket.on("room_full_error", onRoomFullError);
    socket.on("join_error", onJoinError);

    // --- Tentativa de Conexão Inicial (se necessário) ---
    // Se o socket não iniciar conectado (ex: autoConnect: false em ../socket.js),
    // você precisa iniciar a conexão manualmente.
    if (!socket.connected) {
      console.log(
        "Home.jsx: Socket não conectado inicialmente, tentando conectar..."
      );
      // socket.connect(); // Descomente se autoConnect for false ou se precisar forçar
    } else {
      // Se já começou conectado, garante que o estado isConnected está correto
      // Isso ajuda caso o estado inicial socket.connected fosse true
      setIsConnected(true);
    }

    // Função de limpeza para remover os listeners quando o componente desmontar
    return () => {
      console.log("Home.jsx: Limpando listeners do socket.");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("battle_start", onBattleStart);
      socket.off("room_full_error", onRoomFullError);
      socket.off("join_error", onJoinError);
    };
  }, [navigate, reset]); // Dependências do useEffect

  const onSubmit = async ({ name }) => {
    setIsLoading(true);
    setError(null);

    // --- USA O ESTADO isConnected ---
    if (!isConnected) {
      setError("Erro: Não conectado ao servidor.");
      setIsLoading(false);
      return;
    }

    try {
      // Assumindo que não precisamos mais enviar socketId para createPlayer
      const playerResponse = await createPlayer({ name });
      if (!playerResponse || !playerResponse.data || !playerResponse.data.id) {
        throw new Error("Resposta inválida ao criar jogador.");
      }
      const playerId = playerResponse.data.id;
      console.log(`Emitindo userJoinRoom com playerId: ${playerId}`);
      socket.emit("userJoinRoom", { playerId: playerId });
      // Espera pelos eventos 'battle_start' ou erro (tratados no useEffect)
    } catch (err) {
      console.error("Erro no processo de criação/join:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Ocorreu um erro.";
      setError(errorMessage);
      setIsLoading(false);
      reset();
    }
  };

  return (
    <>
      <h1 className="w-full text-center text-2xl font-bold p-10">
        Bem-vindo ao Monster Battle 🧌
      </h1>
      {/* Exibir mensagem de erro */}
      {error && (
        <p className="w-full text-center text-red-600 font-bold mb-4 bg-red-100 border border-red-400 rounded p-2">
          {error}
        </p>
      )}
      {/* Opcional: Mostrar status de conexão para debug */}
      {/* <p className="text-center text-sm text-gray-500 mb-2">Status: {isConnected ? 'Conectado' : 'Desconectado'}</p> */}

      <form
        className="w-full flex flex-col items-center text-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="name">
          Nome
          <input
            id="name"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full max-w-xs mx-auto mt-1 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="text-red-500 text-sm font-bold mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </label>

        <button
          // --- USA O ESTADO isConnected ---
          disabled={isLoading || !isConnected}
          className={`w-auto px-6 py-2 border rounded-md mt-6 text-lg ${
            isLoading || !isConnected // Usa o estado do React aqui
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700 text-white font-bold"
          }`}
          type="submit"
        >
          {/* --- USA O ESTADO isConnected --- */}
          {isLoading
            ? "Entrando..."
            : isConnected
            ? "Entrar na Batalha"
            : "Conectando..."}
        </button>
      </form>
    </>
  );
};
