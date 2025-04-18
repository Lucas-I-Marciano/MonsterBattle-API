import { useEffect, useReducer, useState } from "react";
import { socket } from "../socket";

const reducer = (state, action) => {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        bg: "bg-gray-300 text-white",
        disabled: true,
      };
    case "back":
      return {
        ...state,
        bg: "bg-gray-900",
        disabled: false,
      };
    default:
      return state;
  }
};

export const Card = ({ img, name, hp, attack, defense, speed, actions }) => {
  const handleAction = (action, socketId) => {
    socket.emit("userAction", {
      action,
      socketId,
      name,
      hp,
      attack,
      defense,
      speed,
    });
  };
  const initialClassCard =
    "max-w-2xl mx-4 sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm sm:mx-auto md:mx-auto lg:mx-auto xl:mx-auto mt-8 bg-white shadow-xl rounded-lg text-gray-900";
  const [cardClass, setCardClass] = useState(initialClassCard);

  const [buttonState, dispatch] = useReducer(reducer, {
    bg: "bg-gray-900",
    disabled: false,
  });

  useEffect(() => {
    socket.on("turnFinished", () => {
      setTimeout(() => {
        setCardClass(`${initialClassCard}`);
        dispatch({ type: "back" });
      }, 1000);
    });
  }, []);

  return (
    <div className={cardClass}>
      <div className="rounded-t-lg h-32 overflow-hidden">
        <img
          className="object-cover object-top w-full"
          src="https://images.unsplash.com/photo-1549880338-65ddcdfd017b?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjE0NTg5fQ"
          alt="Mountain"
        />
      </div>
      <div className="mx-auto w-32 h-32 relative -mt-16 border-4 border-white rounded-full overflow-hidden">
        <img
          className="object-cover object-center h-32"
          src={img}
          alt="Monster"
        />
      </div>
      <div className="text-center mt-2">
        <h2 className="font-semibold">{name}</h2>
      </div>
      <ul className="py-4 mt-1 text-gray-700 flex items-center justify-around">
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-blue-700 font-bold">Hp</span>
          <div className="text-center">{hp}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-blue-700 font-bold">Atk</span>
          <div className="text-center">{attack}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-blue-700 font-bold">Def</span>
          <div className="text-center">{defense}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-blue-700 font-bold">Speed</span>
          <div className="text-center">{speed}</div>
        </li>
      </ul>
      <div className="p-4 border-t mx-8 mt-2">
        <div className="flex gap-5 pb-5">
          <button
            disabled={buttonState.disabled}
            onClick={() => {
              handleAction("attack", socket.id.toString());
              setCardClass(
                `${cardClass} ${
                  actions("duration-1000 scale-90 rotate-45").modifiers
                }`
              );
              dispatch({ type: "loading" });
            }}
            className={`w-1/2 block mx-auto rounded-full ${buttonState.bg} hover:shadow-lg font-semibold text-white px-6 py-2`}
          >
            Attack
          </button>
          <button
            disabled={buttonState.disabled}
            onClick={() => {
              handleAction("defend", socket.id.toString());
              setCardClass(
                `${cardClass} ${actions("duration-1000 rotate-270").modifiers}`
              );
              dispatch({ type: "loading" });
            }}
            className={`w-1/2 block mx-auto rounded-full ${buttonState.bg} hover:shadow-lg font-semibold text-white px-6 py-2`}
          >
            Defend
          </button>
        </div>
        <div className="flex gap-5">
          <button
            disabled={buttonState.disabled}
            onClick={() => {
              setCardClass(
                `${cardClass} ${actions("duration-1000 scale-120 ").modifiers}`
              );
              dispatch({ type: "loading" });
            }}
            className={`w-1/2 block mx-auto rounded-full ${buttonState.bg} hover:shadow-lg font-semibold text-white px-6 py-2`}
          >
            Special
          </button>
          <button
            disabled={buttonState.disabled}
            onClick={() => {
              setCardClass(
                `${cardClass} ${actions("duration-1000 scale-25 ").modifiers}`
              );
              dispatch({ type: "loading" });
            }}
            className={`w-1/2 block mx-auto rounded-full ${buttonState.bg} hover:shadow-lg font-semibold text-white px-6 py-2`}
          >
            Forfeit
          </button>
        </div>
      </div>
    </div>
  );
};
