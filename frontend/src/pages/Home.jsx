import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { createPlayer } from "../services/player";
import { socket } from "../socket";
import { useReducer } from "react";
import { joinArena } from "../services/arena";
import { randomMonster } from "../services/monster";
import { useNavigate } from "react-router";

const schema = yup
  .object({
    name: yup.string().required("Please choose a name"),
  })
  .required();

const reducer = (state, action) => {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        isLoading: true,
        text: "Loading...",
        disabled: true,
      };
    default:
      return state;
  }
};

export const Home = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const onSubmit = async ({ name }) => {
    dispatch({ type: "loading" });

    const socketId = socket.id.toString();

    const player = await createPlayer({ name, socket: socketId });

    const response = await joinArena(player.data.id, 5);
    const monster = await randomMonster(response["monster_id"]);

    socket.emit("userJoinRoom", { [socketId]: { monster } });
    navigate("/battle");
  };

  const [buttonState, dispatch] = useReducer(reducer, {
    isLoading: false,
    text: "Create",
    disabled: false,
  });
  return (
    <>
      <h1 className="w-full text-center text-2xl font-bold p-10">
        Welcome to Monster Battle 🧌
      </h1>
      <form
        className="w-full flex flex-col items-center text-center"
        onSubmit={handleSubmit(onSubmit)}
      >
        <label htmlFor="">
          Name
          <input
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            {...register("name")}
          />
          <p className="text-red-500 text-sm font-bold">
            {errors.name?.message}
          </p>
        </label>

        <button
          disabled={buttonState.disabled}
          className={`w-30 border rounded-md mt-10 ${
            buttonState.disabled ? "bg-gray-300 text-white" : "bg-gray-100"
          }`}
          type="submit"
        >
          {buttonState.text}
        </button>
      </form>
    </>
  );
};
